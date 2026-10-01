import {
  useRef,
  Children,
  ReactNode,
  useState,
  useEffect,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "../elements/Icon";
import { Draggable, InertiaPlugin } from "gsap/all";
import { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";

// Register the plugin
gsap.registerPlugin(Draggable, InertiaPlugin);

export interface ResourceLaneProps {
  onClick?: (object: any) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showArrows?: boolean;
  showDots?: "start" | "end";
  children: ReactNode;
  fullScreen?: boolean;
  speed?: number;
  interval: number;
  width?: number;
  autoplay?: boolean;
  loop?: boolean;
  startIndex?: number;
  resistance?: number;
  snapDuration?: number;
  snapOffset?: number;
  centerFocused?: boolean;
  mode?: 'slide' | 'fade';
}

export function Carousel({
  showArrows = false,
  showDots,
  children,
  onClick,
  onDragStart,
  onDragEnd,
  interval = 2,
  speed = 1,
  width = 100,
  fullScreen = false,
  autoplay = false,
  loop = true,
  startIndex = 0,
  resistance = 6000,
  snapDuration = 0.25,
  snapOffset = 10,
  centerFocused = false,
  mode = 'slide',
}: ResourceLaneProps) {
  const context: SharedContextProps = useOutletContext();
  // Arrows sit on top of the cards once the track narrows, so taps near a
  // card's edge hit the button instead — swiping covers it on small screens
  const useArrows = showArrows && !context.inShrink;
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  // The in-flight snap/nav tween, so a press can stop it dead
  const snapTweenRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(
    null,
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(
    startIndex < 0 ? 0 : startIndex,
  );
  const selectedIndexRef = useRef(startIndex < 0 ? 0 : startIndex);
  const items = Children.toArray(children);
  const useInfiniteLoop = mode !== 'fade' && loop && items.length > 1;
  // Clone a fixed number of items on each side — enough for the centering
  // offset to stay positive without tripling the entire array.
  const clonesPerSide = useInfiniteLoop ? Math.min(items.length, 5) : 0;
  const domItems = useInfiniteLoop
    ? [...items.slice(-clonesPerSide), ...items, ...items.slice(0, clonesPerSide)]
    : items;
  const domCount = domItems.length;           // N + 2*clonesPerSide when looping, else N
  const cloneOffset = clonesPerSide;          // real items start at this DOM index
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moveAmount = autoplay === true ? 50 : 100;
  const pauseRef = useRef(false);
  const stoppedRef = useRef(false);

  /******************************
   * Control css for fullscreen mode
   */
  const breakoutStyles: React.CSSProperties = fullScreen
    ? {
        width: `${width}vw`,
        position: "relative",
        left: `${moveAmount}%`,
        right: `${moveAmount}%`,
        marginLeft: `-${Math.round(width / 2)}vw`,
        marginRight: `-${Math.round(width / 2)}vw`,
      }
    : {
        position: "relative",
        width: `${width}%`,
      };

  useEffect(() => {
    // Two frames: card widths aren't final in the first one, and a width
    // measured too early parks the track on a gap instead of a card
    requestAnimationFrame(() => requestAnimationFrame(() => {
      // Instantly position to starting index — no entry animation
      settleToSelected();
      if (mode === 'fade') {
        itemRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { opacity: i === startIndex ? 1 : 0 });
        });
      }
    }));

    // Controls the loop if autoplaying

    const shouldAutoPlay =
      autoplay === true &&
      (mode === 'fade' ? items.length > 1 : carouselExtendsScreen() === true);

    if (shouldAutoPlay !== true) return;

    const int = setInterval(() => {
      if (pauseRef.current === true || stoppedRef.current === true) return;

      scrollToIndex(selectedIndexRef.current + 1);
    }, interval * 1000);

    return () => {
      clearInterval(int);
    };
  }, []);

  /******************************
   * Re-centre whenever the measured layout moves the snap points.
   * The track's offset is a percentage of its own width, so a card that
   * settles to a different size (media loading, fonts, the shrink
   * breakpoint flipping) or a window resize leaves the old offset pointing
   * between two cards.
   */
  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (mode === "fade" || !track || !container) return;

    let frame = 0;
    const resettle = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(settleToSelected);
    };

    const observer = new ResizeObserver(resettle);
    observer.observe(track);
    observer.observe(container);
    // `load` doesn't bubble — catch the cards' images/videos on the way down
    track.addEventListener("load", resettle, true);
    document.fonts.ready.then(resettle);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("load", resettle, true);
    };
  }, []);

  useGSAP(
    () => {
      // Cleanup + Set up
      const totalItems = items.length;
      if (totalItems === 0 || !trackRef.current) return;
      const existingDraggable = Draggable.get(trackRef.current);
      if (existingDraggable) existingDraggable.kill();

      // Kill the old timeline if it exists
      if (tweenRef.current) {
        tweenRef.current.kill();
        gsap.set(trackRef.current, {
          xPercent: 0,
          x: 0,
        });
      }

      if (mode !== 'fade') {
        Draggable.create(trackRef.current, {
          type: "x",
          inertia: true,
          throwResistance: resistance,
          // Draggable only kills the `x` half of the snap tween on press, so
          // kill it ourselves — otherwise xPercent keeps animating under the
          // finger and the tap lands on a different element than it started on
          onPressInit: () => {
            snapTweenRef.current?.kill();
          },
          // A tap that interrupts the snap leaves the track mid-slide
          // (Draggable only resumes it when given `snap` or `bounds`)
          onClick: () => {
            scrollToIndex(getTargetIndex() || 0, snapDuration);
          },
          // Taps wobble a few px on a touchscreen; 2px (the default) reads
          // them as drags and Draggable then suppresses the click
          minimumMovement: 6,
          // Stops Draggable writing an incrementing inline z-index on press
          zIndexBoost: false,
          onThrowUpdate: function () {
            if (isPastEnd() && this.tween?.timeScale() === 1)
              gsap.to(this.tween, {
                timeScale: 10,
                duration: 0.2,
              });
          },
          onThrowComplete: (e) => {
            scrollToIndex(getTargetIndex() || 0, snapDuration);
          },
          onDragStart: (e) => {
            onDragStart && onDragStart();
          },
          onDrag: function () {},
          onDragEnd: () => {
            stoppedRef.current = true;
            onDragEnd && onDragEnd();
          },
        });
      }

      return () => {
        if (Draggable.get(trackRef.current))
          Draggable.get(trackRef.current).kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [items.length],
    },
  );

  /*********************************************
   * Get the current index closest to left of screen
   * based on the current x position
   */
  function getTargetIndex() {
    const track = trackRef.current;
    const container = containerRef.current?.getBoundingClientRect();
    if (!track || !container) return 0;
    // Snap point on screen — the container's centre or its left edge
    const anchor = centerFocused
      ? container.x + container.width / 2
      : container.x;

    let closest = 0;
    let closestDistance = Infinity;
    for (let i = 0; i < track.children.length; i++) {
      const item = track.children[i].getBoundingClientRect();
      const point = centerFocused ? item.x + item.width / 2 : item.x;
      // snapOffset biases the snap towards the next item
      const distance = Math.abs(
        anchor - point + (snapOffset / 100) * item.width,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    }
    return closest - cloneOffset;
  }

  /*********************************************
   * @returns True if the left edge has hit the left of screen or the right edge has hit the right wall
   */
  function isPastEnd() {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return;

    const trackWidth = track.width;
    const trackPostition = track.x;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width || 0;
    let isPastEnd = false;

    if (trackPostition > 0) isPastEnd = true;
    else if (
      trackWidth > containerWidth &&
      trackWidth - -trackPostition < containerWidth
    )
      isPastEnd = true;

    return isPastEnd;
  }

  /************************
   * @returns true if the track width is longer than the screen width
   */
  function carouselExtendsScreen() {
    const trackWidth =
      trackRef.current?.getBoundingClientRect().width;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width;

    if (trackWidth && containerWidth && trackWidth > containerWidth)
      return true;
    else return false;
  }

  /***************************************
   * Returns the xPercent fraction (0–1) for a given DOM index,
   * applying the centering offset and clamping when centerFocused is on.
   * Item positions are measured rather than assumed even, so cards of
   * differing widths (and the track gap) stay correctly aligned.
   */
  function centeredPercent(domIndex: number): number {
    const raw = domIndex / domCount;
    const track = trackRef.current;
    if (!track) return raw;

    const trackRect = track.getBoundingClientRect();
    if (!trackRect.width) return raw;

    // Fall back to evenly sized cards when the item itself can't be measured,
    // so the offset still centres rather than silently left-aligning
    const item = track.children[domIndex] as HTMLElement | undefined;
    const itemRect = item?.getBoundingClientRect();
    const itemWidth = itemRect?.width || trackRect.width / domCount;
    // Distance from the track's start to this item, unaffected by the
    // transform currently applied to the track (both move together)
    const itemStart = itemRect
      ? itemRect.x - trackRect.x
      : raw * trackRect.width;
    if (!centerFocused) return itemStart / trackRect.width;

    const cw = containerRef.current?.getBoundingClientRect().width || 0;
    const offset = cw / 2 - itemWidth / 2;
    const max = (trackRect.width - cw) / trackRect.width;
    return Math.max(0, Math.min((itemStart - offset) / trackRect.width, max));
  }

  /***************************************
   * Jump the track to the selected item's snap point with no animation.
   * Shares centeredPercent with scrollToIndex so the resting position is
   * identical whether it was reached by settling or by navigating.
   */
  function settleToSelected() {
    const track = trackRef.current;
    if (mode === "fade" || !track) return;
    if (Draggable.get(track)?.isDragging) return;
    snapTweenRef.current?.kill();
    gsap.set(track, {
      x: 0,
      xPercent:
        -centeredPercent(selectedIndexRef.current + cloneOffset) * 100,
    });
  }

  /***************************************
   * Scroll to a spefic element on the carousel.
   * `duration` defaults to the carousel's speed — arrow/dot taps pass
   * snapDuration so the move lands quickly.
   */
  function scrollToIndex(index: number, duration: number = speed) {
    if (mode === 'fade') {
      if (loop === false) index = Math.max(0, Math.min(index, items.length - 1));
      else if (index < 0) index = items.length - 1;
      else if (index >= items.length) index = 0;

      const prevEl = itemRefs.current[selectedIndexRef.current];
      const nextEl = itemRefs.current[index];
      if (prevEl && prevEl !== nextEl) gsap.to(prevEl, { opacity: 0, duration: speed });
      if (nextEl) gsap.to(nextEl, { opacity: 1, duration: speed });

      setSelectedIndex(index);
      selectedIndexRef.current = index;
      return;
    }

    // Infinite clone-based loop
    if (useInfiniteLoop) {
      if (index < 0 || index >= items.length) {
        // Wrap to [0, N-1] — works for any distance into clone territory
        const normalized = ((index % items.length) + items.length) % items.length;
        const realDomIndex = cloneOffset + normalized;
        const cloneDomIndex = cloneOffset + index; // the clone slot to animate through

        if (cloneDomIndex >= 0 && cloneDomIndex < domCount) {
          // Animate to the clone that mirrors the target, then silently jump to the real item
          const tl = gsap.timeline();
          snapTweenRef.current = tl;
          tl.to(trackRef.current, {
            x: 0,
            xPercent: -centeredPercent(cloneDomIndex) * 100,
            duration,
            ease: "power2.out",
          }).set(trackRef.current, {
            x: 0,
            xPercent: -centeredPercent(realDomIndex) * 100,
          });
        } else {
          // Dragged so far that no clone exists at that depth — teleport directly
          gsap.set(trackRef.current, { x: 0, xPercent: -centeredPercent(realDomIndex) * 100 });
        }

        setSelectedIndex(normalized);
        selectedIndexRef.current = normalized;
        return;
      }
      // Normal navigation within real items (middle third of DOM)
      snapTweenRef.current = gsap.to(trackRef.current, {
        x: 0,
        xPercent: -centeredPercent(index + cloneOffset) * 100,
        duration,
        ease: "power2.out",
      });
      setSelectedIndex(index);
      selectedIndexRef.current = index;
      return;
    }

    // Non-loop slide mode
    if (index < 0 && loop === false) index = 0;

    let percent = index * (1 / items.length);

    const trackWidth =
      trackRef.current?.getBoundingClientRect().width || 0;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width || 0;
    const isPastEnd =
      trackWidth - trackWidth * percent < containerWidth;

    if (trackWidth < containerWidth) {
      percent = 0;
      index = 0;
    } else if (isPastEnd) {
      if (index >= selectedIndex) {
        percent = (trackWidth - containerWidth) / trackWidth;
        index = items.length - 1;
      } else if (index < selectedIndex && loop === false) {
        percent = 0;
        index = 0;
      }
    }

    // Apply centering offset
    let finalPercent = percent;
    if (centerFocused && trackWidth > containerWidth) {
      const itemWidth = trackWidth / items.length;
      const centerOffsetPercent =
        (containerWidth / 2 - itemWidth / 2) / trackWidth;
      const maxPercent = (trackWidth - containerWidth) / trackWidth;
      finalPercent = Math.max(
        0,
        Math.min(percent - centerOffsetPercent, maxPercent),
      );
    }

    snapTweenRef.current = gsap.to(trackRef.current, {
      x: 0,
      xPercent: -finalPercent * 100,
      duration,
      ease: "power2.out",
    });

    setSelectedIndex(index);
    selectedIndexRef.current = index;
  }

  /*********************
   * Pause animation on mouse enter
   */
  const onMouseEnter = () => {
    pauseRef.current = true;
  };

  /*********************
   * Play animation on mouse enter
   */
  const onMouseLeave = () => {
    // Only resume if not currently being dragged
    if (!Draggable.get(trackRef.current)?.isDragging) {
      autoplay && carouselExtendsScreen() && tweenRef.current?.play();
    }
    pauseRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseEnter}
      onTouchEnd={onMouseLeave}
      style={{
        ...breakoutStyles,
        minHeight: "100px",
        overflowX: "hidden",
        overflowY: "clip",
      }}
    >
      
      {showDots=="start" && items.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            padding: "10px 0",
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { stoppedRef.current = false; scrollToIndex(i, snapDuration); }}
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background:
                  selectedIndex === i ? "var(--accent-sm)" : "var(--thirdColor)",
                    outline:
                  selectedIndex === i ? "var(--accent)" : "var(--accent-md)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "background 0.3s ease, transform 0.3s ease",
                transform: selectedIndex === i ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {useArrows && (loop || selectedIndex !== 0) && (
          <button
            onClick={() => {
              stoppedRef.current = false;
              scrollToIndex(selectedIndex - 1, snapDuration);
            }}
            className="glass-button"
            style={{
              left: 10,
              zIndex: 10,
              position: "absolute",
            }}
          >
            <Icon name="caret-back" color="var(--accent-lg)" />
          </button>
        )}

        <div
          ref={trackRef}
          className="carousel-track"
          style={{
            display: "flex",
            width: mode === 'fade' ? "100%" : "max-content",
            position: mode === 'fade' ? "relative" : undefined,
            gap: fullScreen || mode === 'fade' ? "0px" : "10px",
            willChange: "transform",
            cursor: mode === 'fade' ? "default" : "grab",
          }}
        >
          {[...domItems].map((child, i) => {
            const logicalIndex = i - cloneOffset;
            const isSelected = selectedIndex === logicalIndex;
            const isClone = useInfiniteLoop && (i < cloneOffset || i >= cloneOffset + items.length);
            return (
              <div
                key={i}
                ref={(el) => { if (!isClone) itemRefs.current[logicalIndex] = el; }}
                onClick={() => { if (!isClone) { stoppedRef.current = true; onClick && onClick(child); } }}
                style={{
                  userSelect: "none",
                  zIndex: isSelected ? 1 : 0,
                  ...(mode === 'fade' ? {
                    position: isSelected ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    opacity: logicalIndex === startIndex ? 1 : 0,
                  } : {}),
                }}
              >
                {child}
              </div>
            );
          })}
        </div>

        {useArrows &&
          (loop || selectedIndex !== items.length - 1) && (
            <button
              onClick={() => { stoppedRef.current = false; scrollToIndex(selectedIndex + 1, snapDuration); }}
              className="glass-button"
              style={{
                right: 10,
                zIndex: 10,
                position: "absolute",
              }}
            >
              <Icon name="caret-forward" color="var(--accent-lg)" />
            </button>
          )}
          
      </div>

      {showDots=="end" && items.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            padding: "10px 0",
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { stoppedRef.current = false; scrollToIndex(i, snapDuration); }}
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background:
                  selectedIndex === i ? "var(--accent)" : "var(--accent-md)",
                    border: `1px solid ${selectedIndex === i ? "var(--accent-md)" : "var(--accent-lg)"}`,
                padding: 0,
                cursor: "pointer",
                transition: "background 0.3s ease, transform 0.3s ease",
                transform: selectedIndex === i ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
