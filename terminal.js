document.addEventListener("DOMContentLoaded", () => {
  const terminal = document.getElementById("terminal");
  const terminalClose = document.getElementById("terminal-close");
  const terminalLink = document.getElementById("terminal-link");
  const terminalOutput = document.getElementById("terminal-output");
  const terminalInput = document.getElementById("terminal-input");

  if (!terminal || !terminalClose || !terminalLink || !terminalOutput || !terminalInput) {
    return;
  }

  const filesystem = {
    "about.txt": "I'm an Electronics and Communication Engineering student with a growing focus on offensive security, ethical hacking, and hands-on security labs.",
    "skills.txt": "Languages: Python, C, C++\nTools: Nmap, Wireshark, Metasploit, Burp Suite",
    "projects.txt": "Practice Labs & Walkthroughs on TryHackMe and HackTheBox.",
  };

  const commands = {
    help: "Available commands: help, whoami, date, clear, echo [message], ls, cat [file], scan [ip]",
    whoami: "guest",
    date: () => new Date().toString(),
    clear: () => {
      terminalOutput.innerHTML = "";
      return "";
    },
    echo: (args) => args.join(" "),
    ls: () => Object.keys(filesystem).join("\n"),
    cat: (args) => {
      const filename = args[0];
      if (filesystem[filename]) {
        return filesystem[filename];
      }
      return `cat: ${filename}: No such file or directory`;
    },
    scan: (args) => {
      const target = args[0] || "127.0.0.1";
      let output = `Scanning ${target}...\n\n`;
      output += "PORT     STATE  SERVICE\n";
      output += "22/tcp   OPEN   ssh\n";
      output += "80/tcp   OPEN   http\n";
      output += "443/tcp  OPEN   https\n";
      output += "3306/tcp CLOSED mysql\n";
      output += "\nScan finished.";
      return output;
    },
  };

  const showTerminal = () => {
    terminal.classList.remove("hidden");
    terminalInput.focus();
  };

  const hideTerminal = () => {
    terminal.classList.add("hidden");
  };

  const printWelcomeMessage = () => {
    const welcomeMessage = "Welcome to the terminal. Type 'help' to see available commands.";
    const welcomeLine = document.createElement("div");
    welcomeLine.textContent = welcomeMessage;
    terminalOutput.appendChild(welcomeLine);
  };

  terminalLink.addEventListener("click", (e) => {
    e.preventDefault();
    showTerminal();
  });

  terminalClose.addEventListener("click", hideTerminal);

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const fullCommand = terminalInput.value;
      const [command, ...args] = fullCommand.split(" ");
      terminalInput.value = "";

      const outputLine = document.createElement("div");
      outputLine.innerHTML = `<span class="terminal-prompt">&gt;</span> ${fullCommand}`;
      terminalOutput.appendChild(outputLine);

      if (command in commands) {
        const result = typeof commands[command] === "function" ? commands[command](args) : commands[command];
        if (result) {
          const resultLine = document.createElement("div");
          resultLine.textContent = result;
          terminalOutput.appendChild(resultLine);
        }
      } else {
        const errorLine = document.createElement("div");
        errorLine.textContent = `Command not found: ${command}`;
        terminalOutput.appendChild(errorLine);
      }

      terminal.scrollTop = terminal.scrollHeight;
    }
  });

  printWelcomeMessage();
});
