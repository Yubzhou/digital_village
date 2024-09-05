import svgCaptcha from "svg-captcha-fixed";

const createCaptcha = () => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: "0oO1iIl",
    noise: 2,
    color: true,
    inverse: true,
    noiseColor: "#ff0000",
    // background: "#f0f0f0",
    background: "#c1c1c1",
    fontSize: 50,
    width: 100,
    height: 40,
  });
  return captcha;
};

export default createCaptcha;
