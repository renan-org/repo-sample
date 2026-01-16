package cmd

import (
	"fmt"
)

// Execute runs the specified command with given arguments
func Execute(command string, args []string) error {
	switch command {
	case "hello":
		return helloCommand(args)
	case "info":
		return infoCommand(args)
	default:
		return fmt.Errorf("unknown command: %s", command)
	}
}
