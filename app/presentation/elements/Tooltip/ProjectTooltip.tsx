import type { SharedContextProps } from '~/data/CommonTypes';
import { useOutletContext } from 'react-router';

export interface ProjectTooltipProps {

}

/******************************
 * ProjectTooltip component
 * @todo Create description
 */
export function ProjectTooltip ({}:ProjectTooltipProps)  {
 const context: SharedContextProps = useOutletContext();

  return (
   <div>
      <h1>ProjectTooltip</h1>
      
    </div>
  )
};