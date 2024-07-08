const { Command } = require("commander")
const figlet = require("figlet")

const program = new Command()

console.log(figlet.textSync("Connect 4"))

program
  .version("1.0.0")
  .description("A text based version of Connect 4")
  .option("-l, --ls  [value]", "List directory contents")
  .option("-m, --mkdir <value>", "Create a directory")
  .option("-t, --touch <value>", "Create a file")
  .parse(process.argv)

const options = program.opts()

