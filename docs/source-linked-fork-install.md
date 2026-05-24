# Source-linked fork install

Use this when you need `omp` to run from this fork instead of the published `@oh-my-pi/pi-coding-agent` package. The package version may still print the upstream version, so verify the resolved path, not only `omp --version`.

## Install from this fork

```bash
# Install Bun if it is not already available.
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Clone the fork with SSH.
mkdir -p ~/worktrees
cd ~/worktrees
git clone git@github.com:SamuelReeder/oh-my-pi.git
cd oh-my-pi

# If the fixes are not on the default branch yet, uncomment this:
# git switch fix-openai-responses-resume-400

# Install dependencies without lifecycle scripts.
bun install --ignore-scripts

# Build the native addon required by source-linked omp.
bun --cwd=packages/natives run build

# Generate source artifacts required by the coding agent package.
bun --cwd=packages/coding-agent run generate-docs-index

# Link the local packages into Bun's global command/package resolution.
bun --cwd=packages/agent link
bun --cwd=packages/ai link
bun --cwd=packages/coding-agent link
```

## Verify the active `omp`

```bash
command -v omp
readlink -f "$(command -v omp)"
omp --version
omp --help
```

The resolved path should point into this checkout, for example:

```text
/home/USER/worktrees/oh-my-pi/packages/coding-agent/src/cli.ts
```

If it points into another install directory, put `~/.bun/bin` earlier in `PATH` or rerun the three `bun --cwd=... link` commands above.

## Update an existing source-linked install

```bash
cd ~/worktrees/oh-my-pi
git pull
bun install --ignore-scripts
bun --cwd=packages/natives run build
bun --cwd=packages/coding-agent run generate-docs-index
```

The package links survive ordinary pulls. Re-run the link commands only if `command -v omp` stops resolving to this checkout.

## Return to the published package

```bash
bun install -g @oh-my-pi/pi-coding-agent
```
