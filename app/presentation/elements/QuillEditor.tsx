import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router";
import type Quill from "quill";
import "quill/dist/quill.snow.css";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import { quillToHtml } from "~/business/blogBL";

export interface QuillEditorProps {
  /** Starting content. Read once on mount — remount (change `key`) to reload. */
  initialHTML: string;
  placeholder?: string;
  toolbar: unknown[];
  /** Fires on every edit with the editor's clean HTML ("" when empty) */
  onChange: (html: string) => void;
  /** Toolbar image button: return the URL to embed (e.g. after uploading to
   *  storage), or null to cancel. Replaces Quill's base64 embedding. */
  onImageRequest?: () => Promise<string | null>;
  /** Adds the table buttons (Quill's built-in table module) to the toolbar */
  tables?: boolean;
  /** Paste hook: given the clipboard's plain text and HTML, return HTML to
   *  insert instead (e.g. converted markdown), or null for a normal paste */
  onPasteText?: (text: string, html: string) => string | null;
  className?: string;
}

/** Quill's table module API (not exported in its types) */
interface TableModule {
  insertTable: (rows: number, columns: number) => void;
  insertRowBelow: () => void;
  insertColumnRight: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  deleteTable: () => void;
  getTable: (range?: unknown) => [unknown, unknown, unknown, number];
}

/** Table toolbar buttons. All but "insert" only show while the cursor is in a table. */
const TABLE_TOOLS: {
  name: string;
  label: string;
  title: string;
  run: (table: TableModule) => void;
  inTableOnly: boolean;
}[] = [
  { name: "table-insert", label: "Table", title: "Insert a 3×3 table", run: (t) => t.insertTable(3, 3), inTableOnly: false },
  { name: "table-row-add", label: "+ Row", title: "Add a row below", run: (t) => t.insertRowBelow(), inTableOnly: true },
  { name: "table-col-add", label: "+ Col", title: "Add a column to the right", run: (t) => t.insertColumnRight(), inTableOnly: true },
  { name: "table-row-remove", label: "− Row", title: "Delete this row", run: (t) => t.deleteRow(), inTableOnly: true },
  { name: "table-col-remove", label: "− Col", title: "Delete this column", run: (t) => t.deleteColumn(), inTableOnly: true },
  { name: "table-remove", label: "✕ Table", title: "Delete this table", run: (t) => t.deleteTable(), inTableOnly: true },
];

/******************************
 * Rich-text editor (Quill "snow" theme). Ported from the ping-pong-a-thon
 * site's TCFreeType editor.
 *
 * Quill is imported inside the effect, not at the top: it touches `document`
 * when it loads, and this module is part of the server bundle that prerenders
 * the marketing pages at build time (where there is no DOM).
 */
export function QuillEditor({
  initialHTML,
  placeholder,
  toolbar,
  onChange,
  onImageRequest,
  tables = false,
  onPasteText,
  className = "",
}: QuillEditorProps) {
  const context: SharedContextProps = useOutletContext();
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest callbacks, so the one-time Quill listeners never go stale
  const onChangeRef = useRef(onChange);
  const onImageRequestRef = useRef(onImageRequest);
  const onPasteTextRef = useRef(onPasteText);
  onChangeRef.current = onChange;
  onImageRequestRef.current = onImageRequest;
  onPasteTextRef.current = onPasteText;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    import("quill")
      .then(({ default: QuillClass }) => {
        if (cancelled) return;
        // Assigned below; the toolbar handlers only run after construction
        let quill: Quill;
        const tableModule = () => quill.getModule("table") as TableModule;

        // Toolbar handlers must exist before construction, or Quill skips
        // buttons whose names aren't real formats
        const handlers: Record<string, () => void> = {};
        if (tables)
          for (const tool of TABLE_TOOLS)
            handlers[tool.name] = () => {
              const inTable = tableModule().getTable()[2] != null;
              // Quill tables can't nest
              if (!tool.inTableOnly && inTable) return;
              tool.run(tableModule());
            };

        const host = container.appendChild(document.createElement("div"));
        quill = new QuillClass(host, {
          theme: "snow",
          placeholder,
          modules: {
            toolbar: {
              container: tables
                ? [...toolbar, TABLE_TOOLS.map((t) => t.name)]
                : toolbar,
              handlers,
            },
            table: tables,
            history: { delay: 2000, maxStack: 200, userOnly: true },
          },
        });

        if (initialHTML)
          quill.clipboard.dangerouslyPasteHTML(initialHTML, "silent");

        if (onImageRequestRef.current) {
          const toolbarModule = quill.getModule("toolbar") as {
            addHandler: (name: string, handler: () => void) => void;
          };
          toolbarModule.addHandler("image", async () => {
            const url = await onImageRequestRef.current?.();
            if (!url) return;
            const range = quill.getSelection(true);
            const index = range?.index ?? quill.getLength();
            quill.insertEmbed(index, "image", url, "user");
            quill.setSelection(index + 1, 0);
          });
        }

        if (tables) {
          // Text labels for the table buttons, and only offer the row / column
          // tools while the cursor is inside a table
          const buttons = TABLE_TOOLS.map((tool) => {
            const button = container.querySelector<HTMLButtonElement>(
              `.ql-${tool.name}`,
            );
            if (button) {
              button.textContent = tool.label;
              button.title = tool.title;
              button.classList.add("ql-text-tool");
            }
            return { tool, button };
          });
          const syncTableTools = (range: unknown) => {
            const inTable = tableModule().getTable(range)[2] != null;
            for (const { tool, button } of buttons)
              if (button) button.hidden = tool.inTableOnly ? !inTable : inTable;
          };
          syncTableTools(null);
          quill.on("editor-change", (event: string, ...args: unknown[]) => {
            const range =
              event === "selection-change" ? args[0] : quill.getSelection();
            // Clicking a toolbar button blurs the editor (range null) — keep
            // the buttons as they are, or they'd vanish mid-click
            if (range) syncTableTools(range);
          });
        }

        // Runs before Quill's own paste handler (capture phase) so converted
        // HTML can replace the paste. Inserted as a normal user edit, so
        // Ctrl+Z removes it.
        quill.root.addEventListener(
          "paste",
          (e: ClipboardEvent) => {
            const data = e.clipboardData;
            const convert = onPasteTextRef.current;
            if (!data || !convert) return;
            const html = convert(
              data.getData("text/plain"),
              data.getData("text/html"),
            );
            if (html == null) return;
            e.preventDefault();
            e.stopPropagation();

            const range = quill.getSelection(true);
            const Delta = QuillClass.import("delta") as any;
            const pasted = quill.clipboard.convert({ html });
            quill.updateContents(
              new Delta().retain(range.index).delete(range.length).concat(pasted),
              "user",
            );
            quill.setSelection(range.index + pasted.length(), 0, "silent");
          },
          true,
        );

        quill.on("text-change", () => onChangeRef.current(quillToHtml(quill)));
      })
      .catch(() =>
        context.popAlert("Could not load the editor", "Please refresh", true),
      );

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className={`fill-bkg r-default ${className}`} />;
}
