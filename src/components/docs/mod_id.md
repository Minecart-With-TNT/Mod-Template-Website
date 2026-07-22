# Mod ID

A unique identifier used as the **namespace** for all registry entries, asset paths, and cross-mod API calls.

**Rules:** `a–z`, `0–9`, `_`, `-` only. Max 64 characters. Must be globally unique.

```java
public static final String MOD_ID = "my_mod";

// Used as namespace in registry names:
ResourceLocation.fromNamespaceAndPath(MOD_ID, "my_block");
// → "my_mod:my_block"

// Mirrors your asset folder layout:
// assets/my_mod/textures/block/my_block.png
// data/my_mod/recipes/my_item.json
```

Check [Modrinth](https://modrinth.com) to avoid ID conflicts with existing mods.
