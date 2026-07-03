import { DefaultItem } from "../pluginType"
import { SectorData } from "./index.d"

export default function (): DefaultItem<SectorData>[] {
  const data: SectorData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    r: 50,
    h: 100,
    color: '#e67e22',
    mt: null,
    startAngle: 0,
    endAngle: Math.PI / 2,
  }
  const values: DefaultItem<SectorData>[] = [{
    name: '扇形',
    data
  }]
  return values
}