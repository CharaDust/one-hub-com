package wechat

import (
	"encoding/xml"
	"strings"
)

const (
	EventSubscribe = "subscribe"
	EventScan      = "SCAN"
	MsgTypeEvent   = "event"
)

type WeChatEventXML struct {
	XMLName      xml.Name `xml:"xml"`
	ToUserName   string   `xml:"ToUserName"`
	FromUserName string   `xml:"FromUserName"`
	CreateTime   int64    `xml:"CreateTime"`
	MsgType      string   `xml:"MsgType"`
	Event        string   `xml:"Event"`
	EventKey     string   `xml:"EventKey"`
	Ticket       string   `xml:"Ticket"`
}

func ParseEventXML(body []byte) (*WeChatEventXML, error) {
	var ev WeChatEventXML
	if err := xml.Unmarshal(body, &ev); err != nil {
		return nil, err
	}
	return &ev, nil
}

func SceneFromEventKey(event, eventKey string) string {
	if eventKey == "" {
		return ""
	}
	if event == EventSubscribe && strings.HasPrefix(eventKey, "qrscene_") {
		return strings.TrimPrefix(eventKey, "qrscene_")
	}
	return eventKey
}
