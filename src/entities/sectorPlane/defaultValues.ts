import { DefaultItem } from "../pluginType"
import { SectorPlaneData } from "./index.d"

export default function (): DefaultItem<SectorPlaneData>[] {
  const data: SectorPlaneData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    r: 50,
    color: '#e67e22',
    mt: null,
    startAngle: 0,
    endAngle: Math.PI / 2,
    ds: true,
    img: '',
    imgAngelY: 0,
  }
  const values: DefaultItem<SectorPlaneData>[] = [{
    name: '扇形平面',
    data
  }]
  return values
}