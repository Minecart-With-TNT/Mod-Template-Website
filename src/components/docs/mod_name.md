# Mod Name

The human-readable display name shown in the in-game mod list, crash reports, and modpack configurations.

No character restrictions — spaces, uppercase, and special characters are all valid.

```java
// Access your mod's display name at runtime (Fabric):
String name = FabricLoader.getInstance()
    .getModContainer(MyMod.MOD_ID)
    .map(c -> c.getMetadata().getName())
    .orElse("Unknown");
```
