package wechat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const (
	qrcodeExpireSeconds = 600
	qrcodeURL           = "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=%s"
)

type qrcodeCreateReq struct {
	ExpireSeconds int          `json:"expire_seconds"`
	ActionName    string       `json:"action_name"`
	ActionInfo    qrcodeAction `json:"action_info"`
}

type qrcodeAction struct {
	Scene qrcodeScene `json:"scene"`
}

type qrcodeScene struct {
	SceneStr string `json:"scene_str,omitempty"`
}

type qrcodeCreateResp struct {
	Ticket        string `json:"ticket"`
	ExpireSeconds int    `json:"expire_seconds"`
	URL           string `json:"url"`
	Errcode       int    `json:"errcode"`
	Errmsg        string `json:"errmsg"`
}

func CreateTemporaryQR(sceneStr string) (ticket string, imageURL string, expireSeconds int, err error) {
	token := GetAccessToken()
	if token == "" {
		return "", "", 0, fmt.Errorf("access token not ready")
	}
	body := qrcodeCreateReq{
		ExpireSeconds: qrcodeExpireSeconds,
		ActionName:    "QR_STR_SCENE",
		ActionInfo:    qrcodeAction{Scene: qrcodeScene{SceneStr: sceneStr}},
	}
	data, _ := json.Marshal(body)
	url := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=%s", token)
	req, err := http.NewRequest("POST", url, bytes.NewReader(data))
	if err != nil {
		return "", "", 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", 0, err
	}
	defer resp.Body.Close()
	var r qrcodeCreateResp
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", "", 0, err
	}
	if r.Errcode != 0 {
		return "", "", 0, fmt.Errorf("wechat api: %d %s", r.Errcode, r.Errmsg)
	}
	expireSeconds = r.ExpireSeconds
	if expireSeconds <= 0 {
		expireSeconds = qrcodeExpireSeconds
	}
	imageURL = fmt.Sprintf(qrcodeURL, r.Ticket)
	return r.Ticket, imageURL, expireSeconds, nil
}
