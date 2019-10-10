# -*- coding: utf-8 -*-
import argparse
import json
import os
import pandas as pd
import numpy as np
from scipy import stats

likert_qmap = {
    "In the last ten minutes, have you had a strong temptation/urge to smoke?": "urge",
    "Difficulty concentrating? (In the last 10 minutes)": "concentrating",
    "Sad/Depressed? (In the last 10 minutes)": "sad",
    "Tired/Fatigue? (In the last 10 minutes)": "tired",
    "Angry? (In the last 10 minutes)": "angry",
    "Hungry? (In the last 10 minutes)": "hungry",
    "Anxious/Tense? (In the last 10 minutes)": "anxious",
    "Are you feeling in control of your urge to smoke? (In the last 10 minutes)": "in_control",
}

other_qmap = {
    "What is your current location?":
        {
            "loc_":
                {
                    "Family/ friend's home": "fam_or_friend_home",
                    "Own home": "own_home",
                    "Public Space": "public_space",
                    "Vehicle": "vehicle",
                    "Work": "work",
                    "School": "school",
                    "Other": "other"
                }
        },
    "Have you consumed any of the following since the last prompt (please select all that "
    "apply from your most recent consumption)?":
        {
            "consume_":
                {
                    "Alcoholic drink": "alcohol",
                    "Caffeinated drink": "caffeine",
                    "Drug (prescriptive or non-prescriptive)": "drug",
                    "Food": "food",
                    "Other": "other"
                }
        },
    "In the last 30 minutes were you engaged in social interaction?": "social",
    "If talking, with whom? (select all that apply)":
        {
            "social_":
                {
                    "Supervisor": "supervisor",
                    "Subordinates": "subordinates",
                    "Co-worker": "coworker",
                    "Clients/Customer": "client",
                    "Partner": "partner",
                    "Family Member": "member",
                    "Friend": "friend",
                    "Other": "other",
                }
        },
    "In the last 30 minutes were you engaged in social interaction?": "social",
    "Did you step outdoors or change location to smoke a cigarette?": "change_location",
    "How many cigarettes have you had since the last prompt": "num_cigs",
    "Was there a specific reason for your most recent cigarette?":
        {
            "reason_":
                {
                    "To reduce stress": "none",
                    "To reduce urge": "reduce_stress",
                    "No specific reason": "reduce_urge",
                    "Other": "other",
                }
        },
    "Are you in a place where smoking is permitted?": "smoking_permitted",
    "In the last ten minutes, have you seen any of the following people smoke? (select all that "
    "apply)":
        {
            "seen_people_":
                {
                    "Partner": "partner",
                    "Family Member": "family",
                    "Friend": "friend",
                    "Supervisor": "supervisor",
                    "Subordinate": "subordinate",
                    "Co-worker": "coworker",
                    "Stranger": "stranger",
                    "Other": "other"
                }
        },
    "In the last ten minutes, have you smelled smoke?": "smelled_smoke",
    "In the last ten minutes, have you seen (select all that apply)":
        {
            "seen_smoking_cue_":
                {
                    "Ashtrays": "ashtrays",
                    "Cigarette Butts": "cigarette_butt",
                    "Cigarette Disposal Containers": "disposal_containers",
                    "Cigarette Packs": "cigarette_packs",
                    "Subordinate": "subordinate",
                    "None of the Above": "none"
                }
        }
}

likert_columns = []
other_columns = []


def create_header():
    global likert_columns, other_columns
    header = ["pid", "datetime"]
    likert_columns = list(likert_qmap.values())
    header += likert_columns

    for q in other_qmap:
        prefix = ""
        if not isinstance(other_qmap[q], str):
            prefix = list(other_qmap[q].keys())[0]
            answers = list(other_qmap[q].values())[0]
            for answer in answers:
                other_columns.append(prefix+answers[answer])
        else:
            other_columns.append(prefix+other_qmap[q])

    header += other_columns

    return header


def get_column(question, answer):
    if question in likert_qmap:
        return likert_qmap[question]
    elif question in other_qmap:
        # Case where it's a binary response
        if isinstance(other_qmap[question], str):
            return other_qmap[question]
        # Case where the answer matters (multiple choice or slect all that apply)
        else:
            choices = answer.split(",")

            prefix = list(other_qmap[question].keys())[0]
            columns = []
            for choice in choices:
                if "Other" in choice:
                    columns.append(prefix+"other")
                elif choice == "":
                    print("Choice was the empty string for question \"%s\"" % question)
                    return None
                else:
                    postfix = other_qmap[question][prefix][choice]
                    columns.append(prefix+postfix)

            return columns

    else:
        print("Question \"%s\" not accounted for in maps" % question)
        return None


def add_zscores(df):
    for feature in likert_columns:
        colname = "%s_zscore" % feature
        df[colname] = np.repeat(-1, df.shape[0])

        # Filter out all rows with -1 values
        mask = (df[feature] != -1)
        subset = df.loc[mask][feature]

        if not subset.empty:
            if len(subset.unique()) == 1:
                zscores = np.repeat(0, len(subset))
            else:
                zscores = stats.zscore(subset.values)
            for z_idx, tup in enumerate(subset.iteritems()):
                df[colname].iat[tup[0]] = zscores[z_idx]

    return df


def process_ema_data(pid, ema_data, header):
    df = pd.DataFrame(index=np.arange(len(ema_data)), columns=header)
    df = df.fillna(-1)

    for i, response in enumerate(ema_data):
        df.at[i, "pid"] = pid
        df.at[i, "datetime"] = pd.to_datetime(response["time"])
        for question in response["responses"]:
            answer = response["responses"][question]
            colname = get_column(question, answer)

            if colname is None:
                continue

            if colname in likert_columns:
                df.at[i, colname] = int(response["responses"][question])
            elif isinstance(colname, list):
                for name in colname:
                    df.at[i, name] = 1
            else:
                df.at[i, colname] = 1

    df = add_zscores(df)

    return df


def main(args):
    # Navigate to data directory
    os.chdir(args.base_dir)

    # Get each participant directory
    participants = [filename for filename in os.listdir('./') if
                    filename.startswith('p')]

    frames = []
    header = create_header()
    for participant in participants:
        os.chdir(participant)

        pid = participant.replace('p', "")
        ema_data = json.load(open("./ema/ema_responses.json", "r"))

        frames.append(process_ema_data(pid, ema_data, header))

        os.chdir("../")

    df = pd.concat(frames)
    df.to_csv("all_ema_responses.csv")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("base_dir", type=str,
                        help="Directory containing participant data.")

    main(parser.parse_args())
