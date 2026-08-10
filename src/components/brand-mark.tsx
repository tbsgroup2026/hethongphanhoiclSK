import { Image } from "react-native";

const LOGO_ASPECT_RATIO = 474 / 185;

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/images/logo.png")}
      style={{ height: size, width: size * LOGO_ASPECT_RATIO }}
      resizeMode="contain"
    />
  );
}
