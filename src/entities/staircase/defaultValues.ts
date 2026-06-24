import { StaircaseData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<StaircaseData>[] {
  const values: DefaultItem<StaircaseData>[] = [
    {
      name: '楼梯',
      data: {
        id: Date.now().toString(),
        color: '#646591',
        wmt: 0,
        points: [],
        thickness: 100,
        cornerType: 4,
        stepType: 1,
      }
    }
  ]
  return values
}
