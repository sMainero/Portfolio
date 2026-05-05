# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

##Project data
#Classes:
Use '\_' to indicate private fields.
Classes should be named using PascalCase.
Methods should be named using camelCase.
#Functions:
Functions should be named using camelCase.
#Variables:
Variables should be named using camelCase.
#Constants:
Constants should be named using UPPER_SNAKE_CASE.

#Updates/Movement/Animations
For any updates, animations or movement logic, ensure that the code is optimized for performance and does not cause unnecessary re-renders or calculations.
Also always strive for using Deltatime instead of Date.now() for consistency across different devices and frame rates.

When Creating animations, always strive for smooth transitions and best performance.

#Canvas Main Game functionality
##Portal Class moves the player between maps, it should have a destination map and coordinates for where the player should be placed on the destination map, and origin coordinates.
