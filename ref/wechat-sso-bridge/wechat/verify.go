package wechat

import (
	"crypto/sha1"
	"encoding/hex"
	"sort"
	"strings"
	"wechat-sso-bridge/config"
)

func CheckSignature(signature, timestamp, nonce string) bool {
	arr := []string{config.WeChatToken, timestamp, nonce}
	sort.Strings(arr)
	str := strings.Join(arr, "")
	hash := sha1.Sum([]byte(str))
	hexStr := hex.EncodeToString(hash[:])
	return signature == hexStr
}
