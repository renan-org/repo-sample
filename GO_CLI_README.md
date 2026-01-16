# Go CLI Tool

A simple CLI tool boilerplate written in Go.

## Features

- Clean command structure
- Built-in help and version flags
- Example commands (hello, info)
- Easy to extend with new commands
- Unit tests included

## Building

Build the CLI tool:

```bash
go build -o repo-sample .
```

Build with version information:

```bash
go build -ldflags "-X main.version=1.0.0 -X main.commit=$(git rev-parse --short HEAD) -X main.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o repo-sample .
```

## Usage

### Show help

```bash
./repo-sample -help
```

### Show version

```bash
./repo-sample -version
```

### Hello command

Say hello to someone:

```bash
./repo-sample hello
./repo-sample hello John
./repo-sample hello -uppercase World
```

### Info command

Display application information:

```bash
./repo-sample info
```

## Testing

Run tests:

```bash
go test ./...
```

Run tests with coverage:

```bash
go test -cover ./...
```

## Project Structure

```
.
├── main.go              # Entry point with CLI setup
├── cmd/                 # Command implementations
│   ├── commands.go      # Command dispatcher
│   ├── hello.go         # Hello command
│   ├── info.go          # Info command
│   └── commands_test.go # Unit tests
├── go.mod               # Go module file
└── GO_CLI_README.md     # This file
```

## Adding New Commands

To add a new command:

1. Create a new file in the `cmd/` package (e.g., `cmd/mycommand.go`)
2. Implement your command function:
   ```go
   func myCommand(args []string) error {
       // Your implementation
       return nil
   }
   ```
3. Register the command in `cmd/commands.go`:
   ```go
   case "mycommand":
       return myCommand(args)
   ```
4. Update the usage function in `main.go` to include your command
5. Add tests in `cmd/commands_test.go`

## License

MIT
