import { DefaultItem } from "../pluginType"
import { CylinderData } from "./index.d"

export default function (): DefaultItem<CylinderData>[] {
  const data: CylinderData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    r: 50,
    h: 100,
    color: '#e67e22',
    mt: null,
  }
  const values: DefaultItem<CylinderData>[] = [{
    data
  }]
  return values
}