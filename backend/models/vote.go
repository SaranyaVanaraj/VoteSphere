
package models

import (
    "time"

    "go.mongodb.org/mongo-driver/v2/bson"
)

// Vote represents a response submitted by
// an authenticated VoteSphere user.
type Vote struct {
    ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
    PollID    bson.ObjectID `bson:"poll_id" json:"pollId"`
    VoterID   string        `bson:"voter_id" json:"-"`
    OptionIDs []string      `bson:"option_ids" json:"optionIds"`
    CreatedAt time.Time     `bson:"created_at" json:"createdAt"`
}

