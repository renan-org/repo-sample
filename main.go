package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/renan-org/repo-sample/cmd"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	// Define global flags
	versionFlag := flag.Bool("version", false, "Print version information")
	helpFlag := flag.Bool("help", false, "Show help message")

	flag.Usage = usage
	flag.Parse()

	// Handle version flag
	if *versionFlag {
		printVersion()
		os.Exit(0)
	}

	// Handle help flag
	if *helpFlag {
		usage()
		os.Exit(0)
	}

	// Get command
	args := flag.Args()
	if len(args) == 0 {
		usage()
		os.Exit(1)
	}

	command := args[0]
	commandArgs := args[1:]

	// Execute command
	if err := cmd.Execute(command, commandArgs); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintf(os.Stderr, `Usage: %s [options] <command> [arguments]

A CLI tool boilerplate written in Go.

Options:
  -help        Show this help message
  -version     Print version information

Commands:
  hello        Say hello to someone
  info         Display application information

Examples:
  %s hello John
  %s -version
  %s info

`, os.Args[0], os.Args[0], os.Args[0], os.Args[0])
}

func printVersion() {
	fmt.Printf("Version:    %s\n", version)
	fmt.Printf("Commit:     %s\n", commit)
	fmt.Printf("Build date: %s\n", date)
}
