package cmd

import (
	"fmt"
	"runtime"
)

// infoCommand displays information about the application
func infoCommand(args []string) error {
	fmt.Println("Application Information:")
	fmt.Println("========================")
	fmt.Printf("Go Version:     %s\n", runtime.Version())
	fmt.Printf("OS/Arch:        %s/%s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("CPUs:           %d\n", runtime.NumCPU())
	return nil
}
