# Fabric

A **lightweight, modular** modding toolchain known for fast updates after new Minecraft releases and a simple API surface.

**Auto-resolved for your MC version:**
- **Fabric Loader** — the core mod loading layer
- **Fabric API** — standard utilities: events, registries, networking, rendering hooks

```java
// Your mod entry point:
public class MyMod implements ModInitializer {
    public static final String MOD_ID = "my_mod";

    @Override
    public void onInitialize() {
        // Called once after Fabric Loader initializes.
        // Register blocks, items, and event listeners here.
        MyBlocks.register();
        MyItems.register();
    }
}
```

Entry point declared in `fabric.mod.json`:
```java
{
  "entrypoints": {
    "main": ["com.example.mymod.MyMod"]
  }
}
```
