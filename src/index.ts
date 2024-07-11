import { Command } from "commander"
const figlet = require("figlet")
// import chalk from 'chalk'
// import figlet from "figlet"
import inquirer from 'inquirer'
import { Result, Ok, Err } from 'ts-results'
import type { GameState, Player } from "./types"
import Board from './board'
import { DIRECTION, MAX_COLS } from "./params"

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


class PlayerMoveError extends Error {

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, PlayerMoveError.prototype);
  }
}

type StartGameFn = (board: Board) => GameState
type ProcessGameTurnFn = (gameState: GameState) => Promise<GameState>
type PlayerMoveFn = (gameState: GameState, column: number) => Result<GameState, PlayerMoveError>
type CheckWinConditionFn = (gameState: GameState, column: number) => GameState
type SwitchTurnsFn = (currentPlayer: Player, players: Player[]) => Player
type EndGameFn = (endState: Promise<GameState>) => void


const startGame: StartGameFn = (board: Board): GameState => {
  const players = [{ id: 1, name: 'Player 1', colour: 'red' }, { id: 2, name: 'Player 2', colour: 'yellow' }]

  return {
    board,
    players,
    currentPlayer: players[0],
    winner: null,
    winningLine: null,
  }
}

const playerMove: PlayerMoveFn = (gameState: GameState, column: number): Result<GameState, PlayerMoveError> => {
  const { board, currentPlayer } = gameState

  if (column > MAX_COLS) {
    return Err(new PlayerMoveError(`Player selected column ${column}, there are only ${MAX_COLS} columns`))
  }

  const currentHeight = board.columnTokenCount(column)

  if (currentHeight === board.cells.length) {
    return Err(new PlayerMoveError('Column is used up'))
  }

  const currentRow = (board.cells.length - 1) - currentHeight
  board.cells[currentRow][column] = currentPlayer

  return Ok(gameState)
}

const checkWinCondition: CheckWinConditionFn = (gameState: GameState, column: number): GameState => {
  const { board, currentPlayer } = gameState
  const stackHeight = board.columnTokenCount(column - 1) || 0
  const currentCell: [number, number] = [board.cells.length - stackHeight, column - 1]

  const directions = [
    [DIRECTION.Up, DIRECTION.Down],
    [DIRECTION.Left, DIRECTION.Right],
    [DIRECTION.UpLeft, DIRECTION.DownRight],
    [DIRECTION.UpRight, DIRECTION.DownLeft]
  ]

  directions.forEach(direction => {
    const first = board.findTokens(direction[0], currentPlayer.colour, currentCell)
    const second = board.findTokens(direction[1], currentPlayer.colour, currentCell)
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
    const { board } = res
    console.log(figlet.textSync(`${res.winner?.name}  wins!`))
    board.print(res.winningLine)
  })
}

const processGameTurn: ProcessGameTurnFn = async (gameState: GameState): Promise<GameState> => {
  const { board } = gameState

  if (gameState.winner) {
    return gameState
  }
  board.print()

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
  const board = Board()
  const game = startGame(board)
  const result = processGameTurn(game)
  endGame(result)
}

