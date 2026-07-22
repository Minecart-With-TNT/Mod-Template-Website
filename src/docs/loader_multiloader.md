# Multiloader

Build your mod for **both Fabric and NeoForge** from a single Gradle project using a split-source layout.

**Project structure:**
```
:common    // shared game logic and abstraction layer
:fabric    // Fabric entry point and platform wiring
:neoforge  // NeoForge entry point and platform wiring
```

```java
// common/ — shared logic (no loader-specific imports)
public class MyMod {
    public static final String MOD_ID = "my_mod";

    public static void init() {
        MyBlocks.register();
        MyItems.register();
    }
}

// fabric/ — Fabric entry point
public class MyModFabric implements ModInitializer {
    @Override
    public void onInitialize() {
        MyMod.init();
    }
}

// neoforge/ — NeoForge entry point
@Mod(MyMod.MOD_ID)
public class MyModNeoForge {
    public MyModNeoForge(IEventBus bus) {
        bus.addListener(e -> MyMod.init());
    }
}
```

More setup upfront, but maximizes your mod's reach across both platforms.
