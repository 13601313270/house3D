import { StaircaseData } from "./index.d";

export default function () {
  const values: StaircaseData[] = [
    {
      id: Date.now().toString(),
      color: '#646591',
      wmt: 0,
      points: [],
      thickness: 100,
      cornerType: 4,
      stepType: 1,
    }
  ]
  return values
}
