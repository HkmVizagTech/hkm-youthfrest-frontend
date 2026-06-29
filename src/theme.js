import { extendTheme } from "@chakra-ui/react";

/**
 * Krishna Pulse — design system
 * Palette drawn from Krishna's world: Vrindavan-night indigo, devotional
 * saffron, marigold, peacock-feather teal, festive lotus-pink, temple cream.
 */
const colors = {
  night: {
    50: "#EDEBF6",
    100: "#D2CDEA",
    200: "#A99FD2",
    300: "#7E70B8",
    400: "#5B4C97",
    500: "#3D2F73",
    600: "#2A1F57",
    700: "#1C1440",
    800: "#14102E",
    900: "#0C0921",
  },
  saffron: {
    50: "#FFF3E6",
    100: "#FFE0C2",
    200: "#FFC78F",
    300: "#FFAA5C",
    400: "#FF9233",
    500: "#FF7A1A",
    600: "#E8620B",
    700: "#BD4D07",
    800: "#8F3A06",
    900: "#5E2604",
  },
  marigold: {
    50: "#FFF8E8",
    100: "#FFEDC0",
    200: "#FFDD8C",
    300: "#FFCB54",
    400: "#FFB020",
    500: "#F59800",
    600: "#CC7C00",
    700: "#9C5E00",
    800: "#6E4200",
    900: "#412700",
  },
  peacock: {
    50: "#E5FBF8",
    100: "#BFF4ED",
    200: "#86E9DD",
    300: "#4CD9CB",
    400: "#1EC3B4",
    500: "#0FB6A6",
    600: "#0A9387",
    700: "#0A7268",
    800: "#0A554E",
    900: "#063C37",
  },
  lotus: {
    50: "#FEE9F2",
    100: "#FCC6DD",
    200: "#F895BD",
    300: "#F4639C",
    400: "#F2478B",
    500: "#DE2C73",
    600: "#B91F5D",
    700: "#8F1747",
    800: "#651032",
    900: "#3D091E",
  },
  cream: "#FBF6EC",
  ink: "#221C33",
};

const fonts = {
  heading: `'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif`,
  body: `'Plus Jakarta Sans', system-ui, sans-serif`,
};

const styles = {
  global: {
    "html, body, #root": {
      backgroundColor: colors.night[900],
    },
    body: {
      color: colors.ink,
    },
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 700,
      borderRadius: "xl",
      letterSpacing: "0.01em",
    },
    variants: {
      pulse: {
        bgGradient: "linear(to-r, saffron.500, lotus.400)",
        color: "white",
        boxShadow: "0 12px 30px -10px rgba(242,71,139,0.55)",
        _hover: {
          transform: "translateY(-2px)",
          boxShadow: "0 16px 36px -10px rgba(242,71,139,0.7)",
          _disabled: { transform: "none" },
        },
        _active: { transform: "translateY(0)" },
        transition: "all 0.18s ease",
      },
      peacockGhost: {
        bg: "transparent",
        color: "peacock.300",
        border: "1px solid",
        borderColor: "whiteAlpha.300",
        _hover: { bg: "whiteAlpha.100" },
      },
    },
  },
  Input: {
    variants: {
      pulse: {
        field: {
          bg: "white",
          borderWidth: "1.5px",
          borderColor: "blackAlpha.200",
          borderRadius: "lg",
          _hover: { borderColor: "peacock.300" },
          _focusVisible: {
            borderColor: "peacock.500",
            boxShadow: "0 0 0 3px rgba(15,182,166,0.25)",
          },
        },
      },
    },
    defaultProps: { variant: "pulse" },
  },
  Select: {
    variants: {
      pulse: {
        field: {
          bg: "white",
          borderWidth: "1.5px",
          borderColor: "blackAlpha.200",
          borderRadius: "lg",
          _hover: { borderColor: "peacock.300" },
          _focusVisible: {
            borderColor: "peacock.500",
            boxShadow: "0 0 0 3px rgba(15,182,166,0.25)",
          },
        },
      },
    },
    defaultProps: { variant: "pulse" },
  },
  FormLabel: {
    baseStyle: {
      fontWeight: 600,
      fontSize: "sm",
      color: "night.700",
      mb: 1.5,
    },
  },
};

const theme = extendTheme({
  config: { initialColorMode: "light", useSystemColorMode: false },
  colors,
  fonts,
  styles,
  components,
});

export default theme;
