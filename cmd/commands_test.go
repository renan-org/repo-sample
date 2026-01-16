package cmd

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"
)

// captureOutput captures stdout during function execution
func captureOutput(f func()) string {
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	f()

	w.Close()
	os.Stdout = old

	var buf bytes.Buffer
	io.Copy(&buf, r)
	return buf.String()
}

func TestHelloCommand(t *testing.T) {
	tests := []struct {
		name     string
		args     []string
		expected string
	}{
		{
			name:     "default greeting",
			args:     []string{},
			expected: "Hello, World!",
		},
		{
			name:     "greeting with name",
			args:     []string{"Alice"},
			expected: "Hello, Alice!",
		},
		{
			name:     "uppercase greeting",
			args:     []string{"-uppercase", "Bob"},
			expected: "HELLO, BOB!",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output := captureOutput(func() {
				err := helloCommand(tt.args)
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			})

			if !strings.Contains(output, tt.expected) {
				t.Errorf("expected output to contain %q, got %q", tt.expected, output)
			}
		})
	}
}

func TestInfoCommand(t *testing.T) {
	output := captureOutput(func() {
		err := infoCommand([]string{})
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	expectedStrings := []string{
		"Application Information",
		"Go Version",
		"OS/Arch",
		"CPUs",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("expected output to contain %q, got %q", expected, output)
		}
	}
}

func TestExecute(t *testing.T) {
	tests := []struct {
		name    string
		command string
		args    []string
		wantErr bool
	}{
		{
			name:    "hello command",
			command: "hello",
			args:    []string{},
			wantErr: false,
		},
		{
			name:    "info command",
			command: "info",
			args:    []string{},
			wantErr: false,
		},
		{
			name:    "unknown command",
			command: "unknown",
			args:    []string{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := Execute(tt.command, tt.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("Execute() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
