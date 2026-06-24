import { CanvasShape } from "@/components/GroundTextureEditor/renderer";

type DataItem = {
  name: string,
  data: {
    shape: CanvasShape,
    poleRadius: 5,
    bgColor: '#ffffff',
    poleColor: '#666666',
    width: number,
    height: number,
    img: {
      value: any,
      viewImg: string,
      backgroundColor: string,
    },
  },
};

export default function (): DataItem[] {
  const values: DataItem[] = [
    {
      name: '双向',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "arrow",
              "data": {
                "id": "1782232025898",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -10,
                    "y": 20
                  },
                  {
                    "x": -10,
                    "y": -21
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782232057319",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 10,
                    "y": -20
                  },
                  {
                    "x": 10,
                    "y": 20
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '左转',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 3,
                "points": [
                  {
                    "x": 13,
                    "y": 20
                  },
                  {
                    "x": 13,
                    "y": -13
                  },
                  {
                    "x": -21,
                    "y": -13
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '右转',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": -13,
                    "y": 20
                  },
                  {
                    "x": -13,
                    "y": -13
                  },
                  {
                    "x": 22,
                    "y": -13
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '丁字路口',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 0,
                    "y": 20
                  },
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 21,
                    "y": 0
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -20
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '丁字路口',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 0,
                    "y": 20
                  },
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": -20,
                    "y": 0
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -20
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '丁字路口',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 0,
                    "y": 21
                  },
                  {
                    "x": 0,
                    "y": 13
                  },
                  {
                    "x": 0,
                    "y": -10
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -20,
                    "y": -11
                  },
                  {
                    "x": 20,
                    "y": -11
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAQAElEQVR4Aeyd7ZMUxR3H5w7xAJUQJIgUhYQAHscFEDRJ+YqqWLxI5W2q8iaVVKVCotGA4EMQk9klEqM8iNFonqzKP+LrGB+Qh+M88SQUoQghiIg8ChzuZ2D2dm9ndmdmp2f64WfR3s5sz3T3tz/T3b9fd8/2evJfZgUWzZ9fWTB3biXzDeRCTwDMCMGSBQsqq5f2+asH+vz5c+YIhBl1FAAzCAd89y+b4r/81B3enzZ/1QNEgTCDkLVLBMCaCGn+BfANTPF3bZxWv+z1Z+/0Vi29VVrCuiLJPwiAybXy+hcurNDy7do0reWqPz87y7uvf7I/b/Zs6Y5b1Ik/IQDGa9P0DQYHgDW2fE0Ragd/+c3XPMaEAmFNjIT/3AUwoUBEw9Kli31p020ctg1ASFyBsK1M9S8FwLoU0R8ACaD++NT06AgRZ//629lBSyiGSYQ4E04JgBMEaTwEoAcGp/qvPTOz8XSiz7SEdMe0nokucDSSABhT8Yz5gO/1LXfGxOh8mmuBcOG8eWKYxMglAEYIg7VLt4uPL+LrVKe4BxDivkl1oSORBcAJFQ18K5ZM8tOM+SbcouXwlae/4q289xZfIGyRRqbiGiUBkBWLJ/kvP3lH4+lcPgM0ENK153LD7DfR6kppAW9WB2DQ8jG9dvNU7n8CCJfc4suYcFxaAbCmBfDhZKarrB0q/ffq5hkeoIt1fENm5wEsEr4bknse1jFTenT54TlX/zoNIPCtrHWJRbR8EwF79dczvG8vv81f3t/vtIvGWQBpfXC10CVOhKOo4+3r+4Lu2GUInQQQVwvwYRQUBVtcOkA4+A3PH1yyxMmWsFAA4yqhyPMDixZVMDh2P3F7kcm2TYsVNt9c1OOTt7YRLfzSKQDp6vDFJVnVUnRdkycgZGhQdNplpucMgMC3fHFv00rmMoWPShsHOA8IxlHU9zaecwJAujZalx0bpmhfh4xLgdAVZ7X1ANKl0fLtfHyq9vCFGcRFwzjVBQitBpCu7L57J/s6GRwhZJ3+sorGBQitBRD4cLWonNvtBNH499k+ASFloBXPdgf9r7ISQPx8THUxntK/CtrnMOyObfUTWgcg8NF1mdjtxqGIdcwCBiz5uDimnrcKQLpd1vPhUzO1QuLyjRGFMWVbS2gNgCxvopUwecwXB194HjfS8kW9Vq2stgJAtk7SOjBoDyvL1r+8lYEHjTLbUEbjAaTlw+BgL64NFZKkDCwfY6OTCRB2Ko/RAIbw8V6WTgW17Xv2HbOe0HQXjbEAzp01q0JXhJvCNriSlochBy0hU41Jr9EtnpEA0vKxaZxWQDdBi84PFj+ruk1tCY0DEPh46gW+cdQxTFjAgBtq/KwZn4wCkG6XqSm6HjPkLS6XzPrggDetJTQGQCw+ut0sLwoqDoNyU8I6BkJmg8rNSfLUjQCQpxr4UnW7yTWwKibTdgxRTJm20x5App7odtlLaxUpCgtj0rSd1gDiXmCGw6aFBQq5a7o103bLFl73MdqavtDsQFsAseiAjx1jmmlmTHbojtFwzsyZ2m751BJADA58W9Lydc86U5RoOWv6dC0h1A5AuowHlk31y3xjQffVrtcd/rFtnnf/wBRfRwi1AhCDg4UF/PCLXlVoVG4iMwuE31lxu0/vEhmhpJPaALhyYKCCN9/luV3VDPy9MsfDncXL11WnlfT+vUkjqoxHy8fCAiw3lenIvcdfDceskg56lA4g1i4v53nhsck66OFEHphNoiXUAcJSAWTjNW8sEGu3eO6ZVQLC2TNmlGodlwYg02ur+m/1ZYajePjCFEMIy/QTlgIg8DHmE1dLiEJ5f9+o3l2qYZIrgElkBD5el8HKjSTxJY56Bf7m3xX8th3jcfWpNadQKIABfP2TfZu3TjbLa84RQyEWfeCRKDLXhQHI00XLx/xkmgLO+e4eT0J2DdJozaJW9h3jk01zXTdxCwGQlo+nS1q+bqqqmGtZ3r90wbXC3t6vHEBW59Ly8XQVI6Gk0q0CbHRaes81n7rr9l6drlcKIOMJrF1p+TpVg37fU2cDXx9T/rNiygBkSXgAn4If/tOvuuzMETMmzM8zfldVQiUAhvCxNFxVxuW+xSgAhKsH+pT9jknuAAbd7uJJPj/AUoxEkopqBfBc0BKqsI5zBZA9HGR0+4Y+1ZrI/QtWYMeGKR6LRujd8kw6NwBp+Vj6TUbzzKDcSx8FqFteALpqcDC3BQy5AMhTwaoWfEj6yCU5UaHA9lrvhlttzYMP5gJh1wDiKxpc6Pn4jlQU+MSbqzxdQtLy6ZJf8pE0z2nibXukJ/iVz+899FAlzXVRcbsCkKXdjAuk5YuS1u5zm3903mPa7vtr13bVEmYGEPgwz2UPh92gtSvdhh+c8pgxWbtmTWYIMwHISuZvDU6TxaSe/Lfph596C+4652c1TFIDyMICtk7KYlKBL1Rg67oxr/+eqz5shOeS/k0FIAlgAcnCgqTyuhOPV6gw9Zp22i4xgCF8TFK7I6uUNI0CrHLn/YRpIEwEIK4W7dbzpVFG4hamABAyG8YrVpIk2hFAptfYvSZbJ5PIKXFQAM8IECbZd9wWQFo++nXx8yGrhDQK8NstuOk6bfmMBZAxH/N+qmY40hRG4pqpQLDbbmmf364ljAQQPx9ebjE4zKx4nXL9xta7PQwTJi6i8tUCIBYMF4ifL0ouOZdFATa/MyaMMkyaAGTMR0T5HY4sMhd2jZEJ8aZW7ImJENYBxNolAhaMkSWUTGuvAO+iwZ3HEC/MbAAgLR/r+Vh6HX4hf0UBFQqwx4RXMMMc9+/F2qXbFfiQQ0IRCmDcwhz2RtAC9vT0FJGupCEK1BUYGxsLPvceOnKk8v7IleqGHeeCE/I/UUC1Ao/8/rS354MvqqNHj1aCFnDk8OEKJ9a/+LnqtOX+jivw8LZPvL0fXg3gQ4oAQD7QEr73weVqOwiJJ0EUyKoALd++Q9eqh48dq6+grgPITWkS3//wSnX9dmkJ0UNCfgo89sJn3v6Pxprg4+5NAHKClhBKZUyIGhLyUODxnee9A6PX691u4z1bAORLxoT001zIsQRRIKsCT+6+HMAHU1H3iASQiFxAS7hx5wUOJYgCqRUAvn0fXasOHTpUH/NNvEksgEQcHh2t7B8dq2566SKHEkSBxArQe2JP7B8ZiYWPm7UFkAjQG7SEu1xuCVFCQlIFHn3+jPfe8OW2LV94r44AEhEIxU+IEhI6KfDz3/3fe3f4UhVjtlNcvk8EIBEZE+In/OXzn3IoQRRoUeBn1f957wxdrB45frxtt9t4YWIAuQg/IU0r3myOJYgCoQIhfMdPnUoMH9emApALoJsxIf08xxJEgV88dyoY8504fToVfCiXGkAuYipl6LAnCxgQw/HwqxfPBnO7aVu+ULZMAHIxY0KmVmTuGDXsDe1Kho8Y45ResV28dt9lBpCb4id85+DFKpPMHEtwRwGGYG/tPxc5vZZGha4AJCG6Y54CMUxQw43w8HOfeG8PXWhZWJCl9F0DSKI0wSxqFQhRw+5Ab4c77uiJE6kNjihlcgGQG9chrD0dHEuwTwGWVNHb5QUfCuUGIDcDQp4OvOEcS7BHAZbn4X6jjvMsVa4AkjGeDpzV67ae5FCCBQoAHx6PpNNraYqcO4AkfuzkyWCPSVcQciMJpSuAmw348HioyIwSAMkoELKoVQwT1DAzMO/PkipV8KGKMgC5Od0x4wYGrxxLMEcBrF08Gyq63UYVlAJIQvgJD4xel2k7xDAkPPqHM8G+XepOdZaVA0gBmLYb+tirbpRFrcihdQgNjryt3bhCFwIgibOolcGsLO9HDT0DdUMdqe52G0tfGIAkCoSMK5jE5lhCpAKlnKR3Yqik0uCIKlihAJIBCrhn5Isqm1Y4llC+AiypouXrtIFIRU4LB5BCMCZk6TY+Jo4llKcA1i7Ta/ROZeSiFAApaLC8X95FgxSlBXy0wEddlJWJ0gCkwBSc9YTiJ0SNYkPgZB65kmoDkYoclgogBcLXhGGCBcaxBPUK8MCjeVGulnYlKh1AMhe0hEMXqwjDsQR1CuBkZrEID766VJLfuQnA5JflHxPf07/2n6+uq8oqmvzVvXFH4GN+Xhf4yJU2AJIZ5o7ZVS+raFAj38CYD/jobfK9c3d30wpAisL2PoTCQuNYQvcKoCVjPt3go2TaAUimaAkZp0hLiBrdhRA+nbrdxhJpCSAZBMK3D1yo/njLfziUkEEBnMy0fEdSvKslQzJdXaItgJSKVz1gmPxkyzEOJaRQgH27OJl1ho/iaA0gGTxz4UJFvWFCSvYEpjj3HrpaupM5iaLaA0ghTp09W3n34KVq2bvtTry5yksSyHNZgZVGBz6OfiF4WXlql64RAFIArGMWMDCo5lhCqwKsMOKVyqw4av1WzzPGAIh8QIh1zPIhjiWMK4Am7L8pa1XLeE7SfTIKQIqGdYyf8OlXrnAooaYA7+fD4DCp5atlO/hnHIDkmmk7nvZnXrvxi4ucczX81P+vh7tKRydzkjoxEkAKtnd4ONj8zm9RcOxiwCjDz8fQJGv5y77OWAARDgj/ue/zKj4vjl0KuFoOHu6pmgwf9WU0gBSArod31bkE4RO7L3n8AhFlRwOTg/EAIn5gmNQcr7QKHNscWLiLwcG+GhvKaQWAVAStAe8xsRlC/Hz4Qk20dqmjqGANgBQO6xgIWXjJsU2B33AGPspoU7msApCKoYLwE7IShGMbApvGcTvRyttQnsYylAdgYy5y/kxF2QIhbqbhf/dWbRnzTaxqKwGkkCzAZLe/yd0x3S4LC3A3USYbg7UAUlm0hEBoomHC3C7varEZPurIagApIGNCfGZUKMcmBB4YhhA2WbtxulsPIAVn/ITvjJ1hHOsceFCw5HlwdM5nXnlzAkDEojvGjcHKEY51DMDHkMEV+KgDZwCksMyYsHKk5N12ZKUl8GZS3iJLa93ypcUnnAKQemTynuX9OrWETK/R8rkw5qMOGoNzAFJ4IGRMqMO7aJhew8nsInzUhZMAUnC6Y9bS0fVxXEZgfwt5MG0ZfZ5aOQsgImKYvLXvXCm/d8wQAPhcG/Ohe2NwGkCEYOM2hgmrizkuItDyMQ4l7SLS0zkN5wGkcvhZMXbbFQEhP/ZMWqRJ2k6FiMIKgDdFAQj8hCrfT0jLh5OZ8efNZJ3/IwA2IIB1zPJ+FRCyPAxrV7rdBsFrHwXAmgiN/3ghEu+iybM7puXDz8cKnca05LPnCYARFNASYqECTsTXqU6FLR8Wd6oLHYksAMZUNOM0ukwAionS8TTXsqpFWr54qQTAeG08wAGgLC0h20SZbeEebZJw/itHAMxezwBEd4zjOOldWMnM7+GJwdFZMQGws0YeINGa4cPrFJ0NRAALuJ3iyvdihCRmgDEhPjzGdXEXsYGILtul9XxxWiQ9Ly1gUqVq8cKWMGplNUuqANTVVS01eTL9EwBTygaETKU1GiaM+Tjn8qqWlDLWPLMKUwAAAC9JREFUowuAdSmSfwghxDABRKbwXF/Vkly95pgCYLMeiY8YEzK7obvBkbhAJUX8EgAA//+CYEVuAAAABklEQVQDACYnwFigc8VhAAAAAElFTkSuQmCC",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: 'Y字路口',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 0,
                    "y": 20
                  },
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": -15,
                    "y": -16
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -22
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: 'Y字路口',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277534634",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 0,
                    "y": 20
                  },
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 15,
                    "y": -16
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -22
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '右侧车道变窄',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -10,
                    "y": 21
                  },
                  {
                    "x": -10,
                    "y": -21
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782279266365",
                "opacity": 1,
                "zIndex": 3,
                "points": [
                  {
                    "x": 10,
                    "y": 21
                  },
                  {
                    "x": 10,
                    "y": 0
                  },
                  {
                    "x": 3,
                    "y": -8
                  },
                  {
                    "x": 3,
                    "y": -21
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '左侧车道变窄',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782277918859",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 9,
                    "y": 21
                  },
                  {
                    "x": 9,
                    "y": -22
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782279266365",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -10,
                    "y": 20
                  },
                  {
                    "x": -10,
                    "y": -1
                  },
                  {
                    "x": -3,
                    "y": -8
                  },
                  {
                    "x": -3,
                    "y": -22
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '掉头',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782279466421",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 10,
                    "y": 21
                  },
                  {
                    "x": 10,
                    "y": -16
                  },
                  {
                    "x": -12,
                    "y": -16
                  },
                  {
                    "x": -12,
                    "y": 18
                  }
                ],
                "width": 7,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            }
          ],
          "viewImg": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAQAElEQVR4Aeyd2bNUxRnAm6sIriFKEC1KyQ3i5XoDipqkeLIqlg+pPFmVqrwkpioVE41GBNS4JGfGaIyCWzSazaok/4evxriziAhIKEMhIYiEHYGL8zswc2c5M3OW7j7dfT6L9k6f6dPL17/zdX9fd58ZUfJfbgksuOKK2vzLL6/lzkBuVAJgTggWzp9fu37RjOj68RnRFXPnCoQ55SgA5hAc8N1wzczo+fsvVH948MsKEAXCHIJs3CIANoSQ5V8M3/jM6JkV57Vue/mRS9TSReeIJmxJJP0HATC9rNTY6GgNzffMyvN67vrjI7PVdWPTo3lz5shw3COd/hcEwP6y6fgGgwPA2jVfR4JG5E+/+opiTigQNoSR8l91AUwpIJJh6TLEPrvyfKIDAxCSViAcKKbWlwJgSxTJHwAJoH5//0XJCRKu/vnXc2JNKIZJgnC6LgmAXQJpjwLQjRPnRi89dHH75VSf0YQMx2jPVDdUNJEA2KfjmfMB38sPX9InxfDL3AuEo/PmiWHSR1wCYIJgsHYZdvHxJXyd6RJ5ACHum0w3ViSxANjV0cC3ZOFZUZY5X1cWPdEXHviSuvbqsyOBsEc0shTXLhIAWXLVWdHz913YflnLZ4AGQoZ2LRnmz8SpO0UDnukOwEDzsbx25pL2PzGEC8+OZE44JVoBsCEL4MPJzFDZiBr99+KDsxSgi3V8WsyVB9AmfKdFrhTWMUt6DPnNa1X9W2kAge/axpBoQ/N1A/biL2epby4+P1o8NlZpF01lAUT74GphSOyGw1Z89T0z4uG4yhBWEkBcLcCHUWALtn7lAOHE11Q0sXBhJTWhVQD7dYLN6+MLFtQwOJ5bdYHNYgeWxQ6bry+YFlG3gQkD/LJSADLU4YtLs6vFdl9TJyBkamC77DLLqwyAwLf4qpGOncxlCj6pbBzgPCAYR0nfh3itEgAytKFd1iyf6XwfMi8Fwqo4q4MHkCENzff0vec6D1+zgrhomKdWAcKgAWQou+7q6ZFLBkcTsmF/2UVTBQiDBRD4cLWYXNsdBtHU9/k+ASFtQIvny8H9u4IEED8fS13Mp9zvgsE1bA7HofoJgwMQ+Bi6fBx2+6GIdcwGBiz5fml8vR4UgAy77OfDp+Zrh/SrN0YUxlRomjAYANnehJbwec7XD77mddxIixeMBLWzOggAOTqJdmDS3uysUP/yVgYeNNocQhu9BxDNh8HBWdwQOiRNG9g+xkEnHyAc1h6vAWzCx3tZhjU0tO85d8x+Qt9dNN4CePns2TWGItwUocGVtj1MOdCELDWmvce1dF4CiObj0DhawDWB2q4PFj+7un3VhN4BCHw89QLfFOoYJmxgwA01ddWPT14ByLDL0hRDjx/itVdLVn1wwPumCb0BEIuPYTfPi4LsYVBuSVjHQMhqULk1SV+6FwDyVANfpmE3vQyCSsmyHVMUX5btnAeQpSeGXc7SBkWKwcb4tGznNIC4F1jhCGljgUHuOrJm2e6a0VMRRlvHF45FnAUQiw74ODGWVWavrT2obl2xJQ5zv/2O8i2s+ccnipC13d3pGY6R4dyLL3b2yKeTAGJw4NvKqvkAD9huXbFZvbb2QBy6O8WH+Jq/NwBsBNpCm4rUmSVKZDn7oouchNA5ABkybrzm3CjrGwvoKMAr0lku3kubaFuRuv3t8XnqhvGZkYsQOgUgBgcbC/jhl6wCp6Oy3uNL+oxtS2wWEH5ryQURo0tigpIuOgPgtePjNbz5edZ2dcyXSpJ/6mKLakEK+mttrsKdxcvXibsQRlyoBJqPjQVYbi7Ux8U6MC/UUS/cWYwyrCrpyK9oHqUDiLXLy3mevHt67rbo6pzcFfDsRlaT0IQuQFgqgBy85o0FWa1dz/pbS3Wx6rVkdCYTVpWAcM6sWaVax6UByPLa0rFzIoaEMzKRP5Yl0ISwTD9hKQACH3O+rK4Wy/1TieJeqV9WqmGiFcA0PQZ8vC6DnRtp0ksa8xL4S3Rp/Nt2zMfNl9ZZglUAY/jGpkchH53sFK8/MaZCbPrAI2Gz1tYA5OlC87E+abOBUlZ6CbCplXPH+GTT31UspRUA0Xw8XaL5inWWjbvZ3r9o/klrb+83DuDY6GgNzcfTZUOAWcrY9epSVUbIUscy0nLQadGVJyP6znT5RgFkPoG1K5rPdDfqz58+G//qpPGfFTMGIFvCY/gM/PCffnEXzTHM+1kxYX2e+bupFhoBsAkfW8NNVVzytSMBILx+fIax3zHRDmA87F51VsQPsNgRkZRiWgJ4LtCEJqxjrQByhoOKrl4+w7RMJH/LElizfKZi0wijm86itQGI5mPrNxXVWUHJyx0J0Le8AHTpxIS2DQxaAOSpYFcLPiR3xCU1MSGB1Y3RDbfaTcuWaYGwMID4iiZGVYTvyESDJU/3JPD4ndPiX/n8zs0314rWrhCAbO1mXiCar2g3+Hf/gz84pFi2++4ttxTShLkBBD7M8zxnOPwTt9Q4SQLLv7dHsWJyy0035YYwF4DsZP7GxHmymVTJfyu//5maf+nBKK9hkhlANhZwqEU2kwp8TQk8evukGrvyRAQbzWtp/2YCkAKwgFzcWJC2wZLOjAR4hQpLr1mX7VID2ISPRWozTZBcfZcAu9x5P2EWCFMBiKvFuf18vvdWoPUHQlbDeMVKmiYOBZDlNU6vydHJNOKUNEgAzwgQpjl3PBBANB/juvj5EKuELBLgt1tw0w078tkXQOZ8rPvJCkcWsUvadgnEp+0WzYgGacJEAPHz4eW2bXDcumJLrpdJtjc6y2fev5c1VOFFSFlkOCztK49epjBMWLhIStsDIBYMN5Th51t122VJdZRrnkuAw+/MCZMMkw4AmfORsKzf4Vi25AK1bMmFzoqbB2TVD0t/SJyVz6CK8aZW7IluCFsAYu2SAAtmUEamv6OTTZch+ZcjAd5FgzuPKV6zBjGAaD7287H1uvlFWX+XOaoFeTBE+xWngjMmvIIZ5shtBGuXYdcF+KgQgc7mr4QwJYBxC3PYG7EGnDZtmlMtdU0L8kCI9tOLyOTkZJzhyObt22vvbjpeX77mYHzBlf/R6a7UReqhVwJ3/naveueDz+tbP/64FmvATdu21bhwz1MH9JZUIDdXtCAPgmi/Ah3Zdesdj3+q3vvwRAwfX8UA8gFN+PYHx+qDICSdzUDn2yxPyjIrATTf2s0n69t27GjtoG4BSNGoxHc/PF6/Z7UbmrBsLcgDINoPMoqHu5/8v1q3ZbIDPnLtAJALaEIodWVOCATUS4K/Erj36UNq/dZTrWG3vSU9APIlc0LGaW4kXmYoSwsCvmi/4j1/33PHYvhgKim3RABJyA1owhVPHyZaagCGUisgheeSAPCt3XKyvmHz5tacrzujvgCScOPWrbV1WyfrK589QrS0YFsLArxov2LdzeiJPbFu06a+8FHCQABJAL2xJnymXE0IFNSnnCClZpHAXU/sU29vPDZQ8zXzGwogCYGwbD+hLS0I6KL96PV84ae/+Z96a+PROsZsmhxSAUhGzAnxE/78ic+IlhKAo5SCpdBUEvhJ/b/qzQ1H6tt37hw47LZnlhpAbsJPiGrFm03cdjCtBQFctF++Xm3Ct3PPntTwUVImALkBupkTMs4Ttx2AxHaZUt5gCfzssT3xnG/X3r2Z4CPXzAByE0spG7apUjYwmNKCgC3aj97NFn7x1P54bTer5muWkgtAbmZOyNJKGWvHwEIdJJiXwKAS8BFjnDIqDko36LvcAJIpfsI33z9SZ5GZuK2gWwsCtGi/bL3HFOz1dQcTl9ey5FQIQApiOOYpsG2YAA3lS7AvgTse+1S9seFwz8aCPDUpDCCFooLZ1GoTQl1aEJBF+9GL6QKjHe64j3ftymxwJJWgBUAybkHYeDqI2wjAY6McKeO0BNhSxWinCz5y1QYgmQEhTwfecOKmQ1EtCMCi/dL1EtvzcL/Rx+nuSJdKK4AUydOBs/r2R3cTNR6AyHghFS8A+PB4pF1eyyIu7QBS+I7du+MzJoUgJKMUIa8WBFzRfsMFjJsN+PB4DE+dPYURAKkGELKp1YZhAkyUKUGvBFj3Z0uVKfiorTEAyZzhmHkDk1fipkJWLQiwov0G9wbWLp4NE8Nue8lGAaQg/ITrt54yvmwHVJQnobgE7vrdvvjcLn1XPLfBORgHkOJZttvwkaqvMLipNa0WBFTRfvRKcmgaHLqt3eTSlLICIIWzqZXJrMnt/cBFWRLySYC+oY9MD7vttbMGIIUCIfMKFrGJ6w7DtCCAeqD9dIslVX6MTkyVTBocSRWxCiAVoIHvbPq8zqEV4roDkOnOM/T82FKF5ht2gMiEHKwDSCOYE7J1Gx8TcZ2hnxYETNF+vZLG2mV5jdGp91vzV0oBkGbF2/sNvYsG2ChDwmAJ4KMFPvpicEpz35YGIE2i4ewn1O0n7NaCACnaD4lPhdjJvOl4pgNEU3fr+1QqgDQDXxOGCRYYcV0B6HTlFVo+PPDI3JarZZD8SgeQysWacMOROoIhriM0tSAgivabkihOZjaL8OBPXS3vUweA5VVDKXxP/1p3qH57Xd8uGuArs02ulQ18rM+7Ah/ycQZAKsPaMafqde2iQQuK9kOySjHnAz5Gm9NX3Pi/UwAiEo73ISgsNOISiksAWTLncw0+WuYcgFQKTcg8RZcmJM+qhiZ8Lg277X3hJIBUEAjfWH+4ftvD/yEqIYcEcDKj+bZneFdLjmIK3eIsgLSKVz1gmPzo4R1EJWSQAOd2cTK7DB/NcRpAKrjv8OGaTsOEPHtDWFdY4nxv84nSncxppOo8gDRiz/79tbfeP1q3ddqOMk2GXa8uVXlCmjqx02j9R8kvBE9zv+00XgCIULCO2cDApJq4hF4JsMOIVyqz46j3WzeveAMg4gNCrGO2DxGXMCUBZML5m7J2tUzVJNsnrwCkaVjH+AkfeOE4UQkNCfB+PgwOnzRfo9rxP+8ApNYs2/G0P/TS6V9c5FpVw4+jTxTuKhedzGn6xEsAadh7GzfGh9/5LQriVQwYZfj5mJrkbX/Z93kLIIIDwn+uPVDH50W8SgFXy/vbptV9ho/+8hpAGsDQw7vqqgThqueOKn6BiLYjA5+D9wAi/NgwaThe0QrEQw5s3MXg4FxNCO0MAkA6Am3Ae0xChhA/H75QH61d+igpBAMgjcM6BkI2XhIPKfAbzsBHG0NqV1AA0jF0EH5CdoIQDyFwaBy3E1o+hPa0t6E8ANtrofkzHRUKhLiZNv57pB7KnK+7q4MEkEayAZPT/j4Pxwy7bCzA3USbQgzBAkhnoQmB0EfDhLVd3tUSMnz0UdAA0kDmhPjM6FDiPgQeGKYQIVm7/eQePIA0nPkTvjNOhhF3OfCgYMnz4LhcT111qwSACIvhGDcGO0eIuxiAjylDVeCjDyoDII1lxYSdIyWftqMqPYE3k/IWWbR1z5cBX6gUgPQji/ds73dJE7K8huarwpyPPmgPlQOQeiAZugAAAaZJREFUxgMhc0Kd76Ih3zyB5TWczFWED3lVEkAaznDMXjqGPuJlBM63UAffttHrlFVlAUSIGCavrz1o/feOKZspAPBVbc5H29tDpQFEEBzcxjBhdzFxGwHNxzyUsm2U53IZlQeQzuFnxThtZwNCfuyZsiiTsisVEhorAJ4RCkDgJ9T5fsIzWbf+oPlwMjP/bF2s+AcBsA0ArGO295uAkO1hWLsy7LYJvPFRAGwIof0fL0TiXTQ6h2M0H34+dui0lyWfLf5Ul0/CRhNioQJO0Xo3NR8Wd9G8QrxfNGCfXmWexpAJQH2SDL3MvexqEc3XX1QCYH/ZKMABoDyakGOirLaQx4AiKv9VRQDM388AxHCM4zhtLuxk5vfwxOAYLjEBcLiMFCChzfDhDUvOASKABdxhaeV7MUJSM8CcEB8e87p+N3GAiCG7Svv5+ski7XXRgGkl1UjX1IRJO6vZUgWgVd3V0hBPrn8CYEaxASFLae2GCXM+rlV5V0tGMbaSC4AtUaT/0IQQwwQQWcKr+q6W9NLrTCkAdsojdYw5IasbrhscqRtUUsIvAAAA///t5eJBAAAABklEQVQDAKnT9lgumCl1AAAAAElFTkSuQmCC",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '前方有红绿灯',
      data: {
        shape: 'diamond',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": 40
                  },
                  {
                    "x": 40,
                    "y": 0
                  },
                  {
                    "x": 0,
                    "y": -40
                  },
                  {
                    "x": -40,
                    "y": 0
                  }
                ],
                "width": 2
              }
            },
            {
              "type": "circle",
              "data": {
                "id": "1782279624880",
                "opacity": 1,
                "zIndex": 1,
                "x": 0,
                "y": -16,
                "width": 10,
                "height": 10,
                "rotation": 0,
                "hasBorder": true,
                "borderWidth": 1,
                "color": "#000000",
                "hasFill": true,
                "bgColor": "#dd3121"
              }
            },
            {
              "type": "circle",
              "data": {
                "id": "1782279680610",
                "opacity": 1,
                "zIndex": 2,
                "x": 0,
                "y": 0,
                "width": 10,
                "height": 10,
                "rotation": 0,
                "hasBorder": true,
                "borderWidth": 1,
                "color": "#000000",
                "hasFill": true,
                "bgColor": "#e3e935"
              }
            },
            {
              "type": "circle",
              "data": {
                "id": "1782279714842",
                "opacity": 1,
                "zIndex": 3,
                "x": 0,
                "y": 16,
                "width": 10,
                "height": 10,
                "rotation": 0,
                "hasBorder": true,
                "borderWidth": 1,
                "color": "#000000",
                "hasFill": true,
                "bgColor": "#04a537"
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '三角形双向通行',
      data: {
        shape: 'triangle',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 66,
        img: {
          "value": [
            {
              "type": "arrow",
              "data": {
                "id": "1782232025898",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -10,
                    "y": 30
                  },
                  {
                    "x": -10,
                    "y": -10
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782232057319",
                "opacity": 1,
                "zIndex": 1,
                "points": [
                  {
                    "x": 10,
                    "y": -10
                  },
                  {
                    "x": 10,
                    "y": 30
                  }
                ],
                "width": 5,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 2,
                "points": [
                  {
                    "x": -40,
                    "y": 35
                  },
                  {
                    "x": 0,
                    "y": -36
                  },
                  {
                    "x": 40,
                    "y": 35
                  },
                  {
                    "x": 0,
                    "y": 35
                  },
                  {
                    "x": -40,
                    "y": 35
                  }
                ],
                "width": 2
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#e8bd32"
        },
      }
    },
    {
      name: '三角形警告',
      data: {
        shape: 'triangle',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 66,
        img: {
          "value": [
            {
              "type": "line",
              "data": {
                "id": "1782232085589",
                "opacity": 1,
                "zIndex": 0,
                "points": [
                  {
                    "x": -40,
                    "y": 35
                  },
                  {
                    "x": 0,
                    "y": 35
                  },
                  {
                    "x": 40,
                    "y": 35
                  },
                  {
                    "x": 0,
                    "y": -35
                  },
                  {
                    "x": -40,
                    "y": 35
                  }
                ],
                "width": 6,
                "startArrow": "none",
                "endArrow": "none",
                "color": "#d72d25",
                "startArrowSize": 1,
                "endArrowSize": 1
              }
            },
            {
              "type": "text",
              "data": {
                "id": "1782280265381",
                "opacity": 1,
                "zIndex": 1,
                "x": 13,
                "y": 9,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "！",
                "color": "#000000",
                "size": 51
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#ffffff"
        },
      }
    },
    {
      name: '圆形限速',
      data: {
        shape: 'circle',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 80,
        height: 80,
        img: {
          "value": [
            {
              "type": "circle",
              "data": {
                "id": "1782280436195",
                "opacity": 1,
                "zIndex": 0,
                "x": 0,
                "y": 0,
                "width": 80,
                "height": 80,
                "rotation": 0,
                "hasBorder": true,
                "borderWidth": 8.5,
                "color": "#d72d25",
                "hasFill": false,
                "bgColor": "#FFFFFF"
              }
            },
            {
              "type": "text",
              "data": {
                "id": "1782280265381",
                "opacity": 1,
                "zIndex": 1,
                "x": 0,
                "y": 2,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "120",
                "color": "#000000",
                "size": 35
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#ffffff"
        },
      }
    },
    {
      name: '自定义文字',
      data: {
        shape: 'rect',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        width: 150,
        height: 80,
        img: {
          "value": [
            {
              "type": "text",
              "data": {
                "id": "1782281070674",
                "opacity": 1,
                "zIndex": 0,
                "x": -66,
                "y": -31,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "南",
                "color": "#000000",
                "size": 12
              }
            },
            {
              "type": "text",
              "data": {
                "id": "1782280713980",
                "opacity": 1,
                "zIndex": 1,
                "x": 0,
                "y": -11,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "想你的风",
                "color": "#000000",
                "size": 14
              }
            },
            {
              "type": "text",
              "data": {
                "id": "1782280760935",
                "opacity": 1,
                "zIndex": 2,
                "x": -1,
                "y": 11,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "还是吹到了XXX",
                "color": "#000000",
                "size": 14
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782281047049",
                "opacity": 1,
                "zIndex": 3,
                "points": [
                  {
                    "x": -44,
                    "y": -31
                  },
                  {
                    "x": -59,
                    "y": -31
                  }
                ],
                "width": 4,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 0.6
              }
            },
            {
              "type": "text",
              "data": {
                "id": "1782281092578",
                "opacity": 1,
                "zIndex": 4,
                "x": 66,
                "y": -31,
                "width": 30,
                "height": 40,
                "rotation": 0,
                "text": "北",
                "color": "#000000",
                "size": 12
              }
            },
            {
              "type": "arrow",
              "data": {
                "id": "1782281113833",
                "opacity": 1,
                "zIndex": 5,
                "points": [
                  {
                    "x": 45,
                    "y": -31
                  },
                  {
                    "x": 58,
                    "y": -31
                  }
                ],
                "width": 4,
                "startArrow": "none",
                "endArrow": "triangle",
                "color": "#000000",
                "startArrowSize": 1,
                "endArrowSize": 0.6
              }
            }
          ],
          "viewImg": "data:image/png;base64,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",
          "backgroundColor": "#c1cce7"
        },
      }
    }
  ]
  return values
}
