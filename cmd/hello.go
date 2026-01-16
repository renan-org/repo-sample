package cmd

import (
	"flag"
	"fmt"
)

// helloCommand implements the hello command
func helloCommand(args []string) error {
	fs := flag.NewFlagSet("hello", flag.ExitOnError)
	uppercase := fs.Bool("uppercase", false, "Print greeting in uppercase")

	fs.Usage = func() {
		fmt.Println("Usage: hello [options] [name]")
		fmt.Println("\nSay hello to someone")
		fmt.Println("\nOptions:")
		fs.PrintDefaults()
		fmt.Println("\nExamples:")
		fmt.Println("  hello John")
		fmt.Println("  hello -uppercase World")
	}

	if err := fs.Parse(args); err != nil {
		return err
	}

	name := "World"
	if fs.NArg() > 0 {
		name = fs.Arg(0)
	}

	greeting := fmt.Sprintf("Hello, %s!", name)
	if *uppercase {
		greeting = fmt.Sprintf("HELLO, %s!", name)
	}

	fmt.Println(greeting)
	return nil
}
