import { Command } from "commander"
const figlet = require("figlet")
// import chalk from 'chalk'
const chalk = require("chalk")
// import figlet from "figlet"
import inquirer from 'inquirer'
import { Result, Ok, Err, Option, Some, None } from 'ts-results'

const program = new Command()

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
}

type EndState = {
  board: Board
  winner: Player | null
}

class PlayerMoveError extends Error {

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, PlayerMoveError.prototype);
  }
}

type StartGameFn = () => GameState
type ProcessGameTurnFn = (gameState: GameState) => Promise<Option<EndState>>
type PlayerMoveFn = (gameState: GameState, column: number) => Result<GameState, PlayerMoveError>
type CheckWinConditionFn = (board: Board, column: number) => Player | null
type SwitchTurnsFn = (currentPlayer: Player, players: Player[]) => Player
type EndGameFn = (endState: Promise<Option<EndState>>) => void

const startGame: StartGameFn = (): GameState => {
  console.log("running StartGame")

  const players = [{ id: 1, name: 'Player 1', colour: 'red' }, { id: 2, name: 'Player 2', colour: 'yellow' }]

  return {
    board: {
      cells: Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))
    },
    players,
    currentPlayer: players[0],
  }
}

const playerMove: PlayerMoveFn = (gameState: GameState, column: number): Result<GameState, PlayerMoveError> => {
  if (column > gameState.board.cells[0].length) {
    return Err(new PlayerMoveError(`Player selected column ${column}, there are only ${gameState.board.cells[0].length} columns`))
  }

  const currentHeight = columnTokenCount(gameState.board, column)
  console.log(`column ${column}, current height: ${currentHeight}`)

  if (currentHeight === gameState.board.cells.length) {
    return Err(new PlayerMoveError('Column is used up'))
  }

  const newSlot = (gameState.board.cells.length - 1) - currentHeight
  gameState.board.cells[newSlot][column] = gameState.currentPlayer

  const newHeight = columnTokenCount(gameState.board, column)
  console.log(`column ${column + 1}, new height: ${(newHeight)}`)

  return Ok(gameState)
}

const printBoard = (board: Board): void => {
  const columns = board.cells[0].length

  // Print the column headers
  let header = '  ' + Array.from({ length: columns }, (_, i) => (i + 1).toString()).join('  |  ')
  console.log(chalk.cyan(header))

  // Print the rows
  for (let row of board.cells) {
    let rowStr = '| ' + row.map(cell => formatCell(cell)).join('  |  ') + ' |'
    console.log(rowStr)
    // console.log(chalk.gray('-'.repeat(columns * 2 + 1)))
  }
}

const formatCell = (cell: Player | null): string => {
  if (cell) {
    if (cell.colour === 'red') {
      return chalk.red('O')
    } else if (cell.colour === 'yellow') {
      return chalk.yellow('O')
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

const checkWinCondition: CheckWinConditionFn = (board: Board, column: number): Player | null => {
  console.log(`checkWinCondition board: ${board.cells.length}x${board.cells[0].length} `)
  const stackHeight = columnTokenCount(board, column) || board.cells.length
  console.log(`wincheck counters: ${stackHeight}, col: ${column}`)

  // Vertical checks
  const up =
  const down =

  // Horizontal checks
  const left =
  const right =

  // Diagonal checks
  const leftUp =
  // const leftDown = 
  // const rightUp = 
  // const rightDown = 

  return null
}

const switchTurns: SwitchTurnsFn = (currentPlayer: Player, players: Player[]): Player => {
  return players.filter(player => player.id !== currentPlayer.id)[0]
}

const endGame: EndGameFn = (endState: Promise<Option<EndState>>): void => {
  endState.then(res => console.log("endGame endState", res))
}

const processGameTurn: ProcessGameTurnFn = async (gameState: GameState): Promise<Option<EndState>> => {
  printBoard(gameState.board)

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'column',
      message: `Player ${gameState.currentPlayer.name}, please select a column`,
    },
  ])

  // change gameState
  playerMove(gameState, answers.column - 1)

  printBoard(gameState.board)

  const winResult = checkWinCondition(gameState.board, answers.column)
  if (winResult) {
    return Some({ board: gameState.board, winner: gameState.currentPlayer })
  }

  gameState.currentPlayer = switchTurns(gameState.currentPlayer, gameState.players)

  processGameTurn(gameState)
}

if (Object.keys(options).length === 0) {
  const game = startGame()
  const result = processGameTurn(game)
  endGame(result)

  // startGame()
  // |> processGameTurn
  // |> endGame
}

