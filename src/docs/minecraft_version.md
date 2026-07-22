# Minecraft Version

The Minecraft release your mod targets. This single value drives automatic resolution of:

- Loader version (Fabric Loader / NeoForge / Forge)
- Fabric API version
- Dependency mappings (Yarn / MojMap / Parchment)

Type to filter versions, or click to open the full list. Toggle **snapshots** with `Ctrl+Space` to include pre-release builds.

```java
// Check the running game version at runtime:
String mcVersion = SharedConstants.getCurrentVersion().getName();
// → "1.21.5"
```
