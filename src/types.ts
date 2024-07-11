import { DIRECTION } from "./params"

export type Player = {
  id: number
  name: string
  colour: string
}

export type Board = {
  cells: (Player | null)[][]
  columnTokenCount: (column: number) => number
  findTokens: (direction: DIRECTION, colour: string, cell: [number, number]) => Array<[number, number]>
  print: (winningLine?: Array<[number, number]> | null) => void
}

export type GameState = {
  board: Board
  players: Player[]
  currentPlayer: Player
  winner: Player | null
  winningLine: Array<[number, number]> | null
}
