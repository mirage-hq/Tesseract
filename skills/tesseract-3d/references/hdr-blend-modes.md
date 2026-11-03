# Blend modes in HDR

HDR white=1 is graphics white; alpha remains coverage. SDR behavior is unchanged.

| Modes | HDR behavior |
| --- | --- |
| Normal, Add, Multiply, Lighten, Darken, Subtract, Divide | Native linear BT.2020, no upper RGB clamp |
| Screen, Overlay, SoftLight, HardLight, ColorDodge/Burn, classic dodge/burn, LinearBurn/Light, VividLight, PinLight, HardMix | Blend the bounded SDR display component, carry the channelwise highlight envelope |
| Difference, classic Difference, Exclusion | Same display split/envelope; do **not** difference HDR excess |
| Hue, Saturation, Color | SDR display math; carry destination excess |
| Luminosity | SDR display math; carry source excess |
| DarkerColor, LighterColor | Select using SDR RGB sum; carry selected operand's excess |

Display split: linear Rec.709 `P=clamp(L,0,1)`, `E=L-P`; blend sRGB-encoded
`P`, decode, restore excess, convert to linear BT.2020. Envelope means
`max(Es,Ed,0)+min(Es,Ed,0)` per channel, not additive highlight doubling.
White ties choose source for DarkerColor, destination for LighterColor.
Example: opaque linear source=2/destination=4 yields Screen=4, Difference=3,
Color=4, Luminosity=2; native Add=6 and Multiply=8. HDR blend alpha is
source-over coverage. Bounded contrast output does not cap carried HDR light.

These are defined HDR semantics, not an Adobe HDR fidelity claim.
The packaged table above defines the HDR blend contract. Renderer implementation
and bounded regression evidence are maintained separately from this distribution.

Subtract and Divide are native linear arithmetic because converters use them
structurally, including Premiere channel-Levels division by a linear gray
coverage carrier. Subtract floors at zero; Divide retains the SDR nonpositive
source guard (returns white), but does not cap positive HDR quotients.
For display-domain modes, only the blend function runs in display encoding;
coverage/alpha compositing runs in linear premultiplied BT.2020.
