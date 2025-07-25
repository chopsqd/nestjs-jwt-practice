import { JwtStrategy } from "./jwt.strategy";
import { GoogleStrategy } from "./google.strategy";
import { YandexStrategy } from "./yandex.strategy";

export const STRATEGIES = [JwtStrategy, GoogleStrategy, YandexStrategy];