package models

import (
	"go.mongodb.org/mongo-driver/v2/bson"
	"time"
)

type PollOption struct {
	ID   string `bson:"id" json:"id"`
	Text string `bson:"text" json:"text"`
}

type Poll struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        string        `bson:"user_id" json:"userId"`
	Question      string        `bson:"question" json:"question"`
	Options       []PollOption  `bson:"options" json:"options"`
	AllowMultiple bool          `bson:"allow_multiple" json:"allowMultiple"`
	ShowResults   bool          `bson:"show_results" json:"showResults"`
	Status        string        `bson:"status" json:"status"`
	CreatedAt     time.Time     `bson:"created_at" json:"createdAt"`
}
