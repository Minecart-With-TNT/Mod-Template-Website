# NeoForge

A **community-maintained fork of Minecraft Forge**, launched in 2023 with modernized APIs, active development, and a cleaner codebase.

**Auto-resolved:** the correct NeoForge build for your Minecraft version.

```java
// Your mod entry point:
@Mod(MyMod.MOD_ID)
public class MyMod {
    public static final String MOD_ID = "my_mod";

    public MyMod(IEventBus modEventBus) {
        // Register listeners on the mod-lifecycle event bus
        modEventBus.addListener(this::onCommonSetup);
        modEventBus.addListener(this::onRegister);
    }

    private void onCommonSetup(FMLCommonSetupEvent event) {
        // Common initialization (client + server)
    }

    private void onRegister(RegisterEvent event) {
        // Register blocks, items, etc.
    }
}
```

Mod metadata lives in `META-INF/neoforge.mods.toml`.
