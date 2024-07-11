import { Command } from "commander"
const figlet = require("figlet")
// import chalk from 'chalk'
const chalk = require("chalk")
// import figlet from "figlet"
import inquirer from 'inquirer'
import { Result, Ok, Err } from 'ts-results'
import { match } from 'ts-pattern'

const program = new Command()

enum DIRECTION {
  Up = 1,
  Down,
  Left,
  Right,
  UpLeft,
  UpRight,
  DownLeft,
  DownRight,
}

console.log(figlet.textSync("Connect 4"))

program
  .version("1.0.0")
  .description("A text based version of Connect 4")
  // .option("-l, --ls  [value]", "List directory contents")
  // .option("-m, --mkdir <value>", "Create a directory")
  // .option("-t, --touch <value>", "Create a file")
  .parse(process.argv)

const options = program.opts()

type Player = {
  id: number
  name: string
  colour: string
}

type Board = {
  cells: (Player | null)[][]
}

type GameState = {
  board: Board
  players: Player[]
  currentPlayer: Player
  winner: Player | null
  winningLine: [[number, number]] | null
}

const MAX_ROWS = 5
const MAX_COLS = 6

class PlayerMoveError extends Error {

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, PlayerMoveError.prototype);
  }
}

type StartGameFn = () => GameState
type ProcessGameTurnFn = (gameState: GameState) => Promise<GameState>
type PlayerMoveFn = (gameState: GameState, column: number) => Result<GameState, PlayerMoveError>
type CheckWinConditionFn = (gameState: GameState, column: number) => GameState
type SwitchTurnsFn = (currentPlayer: Player, players: Player[]) => Player
type EndGameFn = (endState: Promise<GameState>) => void

const startGame: StartGameFn = (): GameState => {
  const players = [{ id: 1, name: 'Player 1', colour: 'red' }, { id: 2, name: 'Player 2', colour: 'yellow' }]

  return {
    board: {
      cells: Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))
    },
    players,
    currentPlayer: players[0],
    winner: null,
    winningLine: null,
  }
}

const playerMove: PlayerMoveFn = (gameState: GameState, column: number): Result<GameState, PlayerMoveError> => {
  if (column > gameState.board.cells[0].length) {
    return Err(new PlayerMoveError(`Player selected column ${column}, there are only ${gameState.board.cells[0].length} columns`))
  }

  const currentHeight = columnTokenCount(gameState.board, column)

  if (currentHeight === gameState.board.cells.length) {
    return Err(new PlayerMoveError('Column is used up'))
  }

  const currentRow = (gameState.board.cells.length - 1) - currentHeight
  gameState.board.cells[currentRow][column] = gameState.currentPlayer

  return Ok(gameState)
}

const printBoard = (board: Board, winningLine?: [[number, number]]): void => {
  const columns = board.cells[0].length

  // Print the column headers
  let header = '  ' + Array.from({ length: columns }, (_, i) => (i + 1).toString()).join('  |  ')
  console.log(chalk.cyan(header))

  // Create a Set from winningLine for efficient lookups
  const winningLineSet = new Set(winningLine?.map(([row, col]) => `${row},${col}`));

  // Print the rows
  // Nb. needs refactoring, move to model
  for (let rowIndex = 0; rowIndex < board.cells.length; rowIndex++) {
    let row = board.cells[rowIndex];
    let rowStr = '| ' + row.map((cell, colIndex) => {
      let marked = winningLineSet.has(`${rowIndex},${colIndex}`);
      return formatCell(cell, marked);
    }).join('  |  ') + ' |';
    console.log(rowStr);
  }
}

const formatCell = (cell: Player | null, marked: boolean): string => {
  if (cell) {
    if (cell.colour === 'red') {
      return marked ? chalk.red('X') : chalk.red('O')
    } else if (cell.colour === 'yellow') {
      return marked ? chalk.yellow('X') : chalk.yellow('O')
    }
  }

  return chalk.grey('O')
}

const columnTokenCount = (board: Board, column: number): number => {
  let tokenCount = 0
  for (let i = board.cells.length - 1; i >= 0; i--) {
    if (board.cells[i][column]) {
      tokenCount++
    }
  }

  return tokenCount
}

const findTokens = (direction: DIRECTION, board: Board, colour: string, cell: [number, number]): [[number, number]] => {
  let [row, col] = cell
  let tokens: [[number, number]] = []

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
      .exhaustive();

    if (row < 0 || row > MAX_ROWS || col < 0 || col > MAX_COLS || board.cells[row][col]?.colour !== colour) {
      break;
    }

    tokens.push([row, col])
  }

  return tokens
}

const checkWinCondition: CheckWinConditionFn = (gameState: GameState, column: number): GameState => {
  const stackHeight = columnTokenCount(gameState.board, column - 1) || 0
  const currentCell = [gameState.board.cells.length - stackHeight, column - 1]

  const directions = [
    [DIRECTION.Up, DIRECTION.Down],
    [DIRECTION.Left, DIRECTION.Right],
    [DIRECTION.UpLeft, DIRECTION.DownRight],
    [DIRECTION.UpRight, DIRECTION.DownLeft]
  ]

  directions.forEach(direction => {
    const first = findTokens(direction[0], gameState.board, gameState.currentPlayer.colour, currentCell)
    const second = findTokens(direction[1], gameState.board, gameState.currentPlayer.colour, currentCell)
    const combined = [[currentCell], first, second].filter(arr => arr.length > 0).flat()
    const lineLength = first.length + 1 + second.length

    if (lineLength >= 4) {
      gameState.winner = gameState.currentPlayer
      gameState.winningLine = combined
    }
  })

  return gameState
}

const switchTurns: SwitchTurnsFn = (currentPlayer: Player, players: Player[]): Player => {
  return players.filter(player => player.id !== currentPlayer.id)[0]
}

const endGame: EndGameFn = (gameState: Promise<GameState>): void => {
  gameState.then(res => {
    console.log(figlet.textSync(`${res.winner.name}  wins!`))
    printBoard(res.board, res.winningLine)
  })
}

const processGameTurn: ProcessGameTurnFn = async (gameState: GameState): Promise<GameState> => {
  if (gameState.winner) {
    return gameState
  }
  printBoard(gameState.board)

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'column',
      message: `Player ${gameState.currentPlayer.name}, please select a column`,
    },
  ])

  playerMove(gameState, answers.column - 1)

  const newGameState = checkWinCondition(gameState, answers.column)
  if (!newGameState?.winner) {
    gameState.currentPlayer = switchTurns(gameState.currentPlayer, gameState.players)
  }

  return processGameTurn(newGameState)
}

if (Object.keys(options).length === 0) {
  const game = startGame()
  const result = processGameTurn(game)
  endGame(result)
}

