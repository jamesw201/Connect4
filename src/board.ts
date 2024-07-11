const chalk = require("chalk")
import { match } from 'ts-pattern'

import type { Board, Player } from "./types"
import { DIRECTION, MAX_COLS, MAX_ROWS } from "./params"


function Board(): Board {
  const cells: (Player | null)[][] = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))

  function columnTokenCount(column: number): number {
    let tokenCount = 0
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i][column]) {
        tokenCount++
      }
    }

    return tokenCount
  }

  function print(winningLine?: Array<[number, number]> | null): void {
    // Print the column headers
    let header = '  ' + Array.from({ length: MAX_COLS + 1 }, (_, i) => (i + 1).toString()).join('  |  ')
    console.log(chalk.cyan(header))

    // Create a Set from winningLine for efficient lookups
    const winningLineSet = new Set(winningLine?.map(([row, col]) => `${row},${col}`));

    // Print the rows
    // Nb. needs refactoring, move to model
    for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
      let row = cells[rowIndex];
      let rowStr = '| ' + row.map((cell, colIndex) => {
        let marked = winningLineSet.has(`${rowIndex},${colIndex}`);
        return formatCell(cell, marked);
      }).join('  |  ') + ' |';
      console.log(rowStr);
    }
  }

  function formatCell(cell: Player | null, marked: boolean): string {
    if (cell) {
      if (cell.colour === 'red') {
        return marked ? chalk.red('X') : chalk.red('O')
      } else if (cell.colour === 'yellow') {
        return marked ? chalk.yellow('X') : chalk.yellow('O')
      }
    }

    return chalk.grey('O')
  }

  function findTokens(direction: DIRECTION, colour: string, cell: [number, number]): Array<[number, number]> {
    let [row, col] = cell
    let tokens: Array<[number, number]> = []

    while (true) {
      [row, col] = match(direction)
        .with(DIRECTION.Up, () => [row - 1, col])
        .with(DIRECTION.Down, () => [row + 1, col])
        .with(DIRECTION.Left, () => [row, col - 1])
        .with(DIRECTION.Right, () => [row, col + 1])
        .with(DIRECTION.UpLeft, () => [row - 1, col - 1])
        .with(DIRECTION.UpRight, () => [row - 1, col + 1])
        .with(DIRECTION.DownLeft, () => [row + 1, col - 1])
        .with(DIRECTION.DownRight, () => [row + 1, col + 1])
        .otherwise(() => [])

      if (row < 0 || row > MAX_ROWS || col < 0 || col > MAX_COLS || cells[row][col]?.colour !== colour) {
        break;
      }

      tokens.push([row, col])
    }

    return tokens
  }


  return Object.freeze({
    cells,
    columnTokenCount,
    findTokens,
    print,
  })
}

export default Board
