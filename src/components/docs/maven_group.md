# Maven Group

Your Java package group identifier — the root of your class namespace. Follows the **reversed domain name** convention.

```java
// maven_group = com.example
// mod_id      = mymod
//
// Your main class lives at:
package com.example.mymod;

public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";

    @Override
    public void onInitialize() { }
}
```

**No domain?** Use `io.github.yourusername` or `dev.yourusername`. Avoid `com.example` in published mods.
