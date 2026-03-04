import { DifficultyBucket, TopicId } from "../game/types";

export type RootStackParamList = {
  Home: undefined;
  FocusSetup: undefined;
  Game:
    | {
        mode: "focus";
        bucket: DifficultyBucket;
        topic: TopicId;
      }
    | {
        mode: "progression";
      };
  Settings: undefined;
};
