# Mod Version

Version string for your mod. The template uses [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

| Segment | When to bump |
|---------|-------------|
| MAJOR | Breaking changes or major rewrites |
| MINOR | New features, backwards-compatible |
| PATCH | Bug fixes only |

```java
// Read your own version at runtime (Fabric):
String version = FabricLoader.getInstance()
    .getModContainer(MyMod.MOD_ID)
    .map(c -> c.getMetadata().getVersion().getFriendlyString())
    .orElse("unknown");
```

Start at `1.0.0` for initial releases. Use suffixes like `1.0.0-beta.1` for pre-releases.
