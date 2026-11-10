# 打卡：iPhone 捷徑設定

只做一次（約 15 分鐘）。打卡怎麼運作、`location.json` 的欄位、token 到期怎麼辦，見 [README 3.5](../README.md#35-打卡自動)；外出那天的建築見 [README 3.6](../README.md#36-外出那天的建築新建築)。

| 步驟 | 內容 |
|---|---|
| 1 | 在電腦上建立 token |
| 2 | 建立捷徑「打卡：家」 |
| 3 | 測試 |
| 4 | 複製出另外三個打卡捷徑 |
| 5 | 做「打卡：在家嗎」 |
| 6 | 設定五個自動化 |
| 7 | 做「打卡：外出」（唯一要手動按的） |

先做「家」、測試成功後再複製成「辦公室」，因為測試時會真的打一次卡，打辦公室會讓今天變成辦公室日。

## 步驟 1：在電腦上建立 token（打卡用的鑰匙，只能觸發打卡，不能改網站）

1. 打開 <https://github.com/settings/personal-access-tokens/new>
2. Token name：`website check-in`
3. Expiration：選最長的（1 年）
4. Repository access：**Only select repositories** → 選 `laiyenju.github.io`
5. Permissions：**Add permissions** → **Actions** → Access 改成 **Read and write**（Metadata 會自動加上唯讀，不用管）
6. **Generate token**，複製 `github_pat_…` 開頭的那串字。只會顯示這一次，先存進密碼管理器，再傳到手機

## 步驟 2：在 iPhone 建立捷徑「打卡：家」（捷徑 App，括號裡是英文介面的名稱）

1. 「捷徑」分頁 → 右上 **＋** → 最上面的名稱改成 `打卡：家`
2. 搜尋動作 `URL` → 點 **取得 URL 內容**（Get Contents of URL）
3. 點動作裡藍色的 **URL**，貼上：
   `https://api.github.com/repos/laiyenju/laiyenju.github.io/actions/workflows/checkin.yml/dispatches`
4. 點動作右邊的 **›**（展開），會出現「方法」「標頭」「要求本文」
5. **方法**（Method）：`GET` 改成 `POST`
6. **標頭**（Headers）→ **新增新標頭**（Add new header），加兩個：

   | 鍵 | 值 |
   |---|---|
   | `Authorization` | `Bearer github_pat_…`（Bearer、一個空格、你的 token） |
   | `Accept` | `application/vnd.github+json` |

7. **要求本文**（Request Body）選 **JSON**，然後：
   - **新增新欄位**（Add new field）→ **文字**（Text）→ 鍵 `ref`，值 `main`
   - **新增新欄位** → **辭典**（Dictionary）→ 鍵 `inputs` → 點這一列進去 → **新增新欄位** → **文字** → 鍵 `place`，值 `home` → 左上返回
8. 完成後應該長這樣：

   ```
   取得 URL 內容  https://api.github.com/repos/…/checkin.yml/dispatches
     方法     POST
     標頭     Authorization: Bearer github_pat_…
              Accept: application/vnd.github+json
     要求本文 JSON
              ref: main
              inputs (辭典)
                place: home
   ```

## 步驟 3：測試

1. 在捷徑裡按右下 **▶︎** 執行。沒有跳出任何訊息就是成功（GitHub 成功時不回內容）
2. 到 GitHub → Actions → **Check in**，應該有一筆綠色勾勾
3. 約 5 分鐘後，首頁 terminal 按 **Where's Yen**，會看到 `Yen is at home, Taipei. Checked in at HH:MM.`

跳出一段英文時，看裡面的數字或 message：

| 訊息 | 原因 |
|---|---|
| `Bad credentials`（401） | token 貼錯、過期，或 `Bearer` 後面少了空格 |
| `Resource not accessible`（403） | token 的權限不是 Actions：Read and write |
| `Not Found`（404） | URL 打錯，或 token 沒選 `laiyenju.github.io` |
| `Unprocessable`（422） | 要求本文錯：`ref` 不是 `main`、`place` 不是 `home`／`office`／`out`／`left_home`／`left_office`，或 `inputs` 不是辭典 |

## 步驟 4：複製出另外三個打卡捷徑

長按「打卡：家」→ **複製**（Duplicate）→ 改名稱和 `inputs` 裡的 `place`。都不要執行（會真的打卡）。

| 捷徑 | `place` |
|---|---|
| `打卡：辦公室` | `office` |
| `打卡：離開家` | `left_home` |
| `打卡：離開辦公室` | `left_office` |

## 步驟 5：做「打卡：在家嗎」（平日 10:30 自動執行，整天沒出門的休假日靠它，不用手動）

1. 新捷徑，名稱 `打卡：在家嗎`
2. 加動作 **取得距離**（Get Distance）：從 家的地址（Home）到 **目前位置**（Current Location）。展開後：路線類型（Route Type）**直線**（Direct）、單位 **公里**（Kilometers）。不用另外加「取得目前位置」
3. 加動作 **如果**（If）：**距離**（Distance）**小於**（is less than）`0.5`。會自動出現「否則」（Otherwise）和「結束如果」（End If）
4. 加動作 **執行捷徑**（Run Shortcut）→ 選 **打卡：家**，然後**按住它拖到「如果」和「否則」中間**。放在「結束如果」下面的話，不管在不在家都會打卡
5. 「否則」裡面留空：不在家就什麼都不打。完成後應該長這樣：

   ```
   取得距離  從 Home 到 目前位置（直線、公里）
   如果  距離 小於 0.5
     執行捷徑  打卡：家
   否則
   結束如果
   ```

平日早上在家工作也會變成家，這是對的（那天確實在家）。之後才去公司，抵達辦公室的打卡會把今天改回辦公室。

## 步驟 6：設定自動化（五個，全部選「立即執行」）

一個自動化只能有一個觸發條件，所以是五個分開的自動化，在「自動化」分頁會看到五列。

1. 「自動化」分頁 → 右上 **＋** → **抵達**（Arrive）
2. 位置 → **選擇** → 搜尋家的地址 → 完成；時間選 **任何時間**
3. 選 **立即執行**（Run Immediately）。「執行時通知」可以關掉
4. **下一步** → 選捷徑 **打卡：家** → 完成
5. 照同樣方式做其他四個：

| 觸發 | 捷徑 |
|---|---|
| 抵達 公司 | 打卡：辦公室 |
| 離開（Leave） 家 | 打卡：離開家 |
| 離開 公司 | 打卡：離開辦公室 |
| 特定時間（Time of Day）10:30（要在 `OFFICE_HOURS` 裡面，09:00–18:30），重複選 **每週** 一到五 | 打卡：在家嗎 |

第一次可能會問位置權限，選允許（「在家嗎」要讀目前位置）。

## 步驟 7：做「打卡：外出」

唯一要手動按的捷徑（例如在咖啡店）。它也問「要當成今天的建築嗎？」，選「是」會送出手機的位置（README 3.6）。

動作名稱用英文介面寫，括號裡是中文介面。在捷徑裡用搜尋找動作；加進來的動作會放在最下面，要按住它拖到要放的位置。

1. 長按「打卡：家」→ **Duplicate**（複製），改名成 `打卡：外出`。
2. 在最上面加 **Ask for Input**（要求輸入），類型 Text，Prompt 寫 `在哪裡？英文，例如 at a café in Daan`。
3. 接著加 **Choose from Menu**（從選單中選擇），Prompt 寫 `要當成今天的建築嗎？`，兩個選項改成 `是`、`否`。
4. 把下面這些動作拖到 `是` 和 `否` 中間，照這個順序：

   | 動作 | 設定 |
   |---|---|
   | **Ask for Input**（要求輸入） | Prompt：`做了什麼？英文，例如 hosted a developer meetup` |
   | **Set Variable**（設定變數） | 名稱 `did`，值選上一步的 **Provided Input**（提供的輸入） |
   | **Get Current Location**（取得目前位置） | 不用設定 |
   | **Text**（文字） | 點 Insert Variable 選 **Current Location**，再點它選 **Latitude**（緯度）；打一個逗號 `,`；再插入一次 **Current Location**，選 **Longitude**（經度）。結果像 `25.0346,121.5667` |
   | **Set Variable** | 名稱 `latlon`，值選上一步的 **Text** |
   | **Text** | 插入 **Current Location** 選 **Name**（名稱），打一個空格，再插入一次選 **Street**（街道） |
   | **Set Variable** | 名稱 `note`，值選上一步的 **Text** |

   `否` 底下什麼都不放。
5. 在 **Get Contents of URL**（取得 URL 內容）的 Request Body，點 `inputs` 那一列進去：
   - `place` 的值改成 `out`。
   - 加一個 Text 欄位，鍵 `label`，值選第 2 步的 **Provided Input**。
   - 再加三個 Text 欄位，鍵是 `latlon`、`did`、`note`，值各選同名的變數。

完成後從上到下是：

```
Ask for Input（在哪裡？）
Choose from Menu（要當成今天的建築嗎？）
  是
    Ask for Input（做了什麼？）→ Set Variable did
    Get Current Location → Text（緯度,經度）→ Set Variable latlon
    Text（名稱 街道）→ Set Variable note
  否
End Menu
Get Contents of URL
  inputs：place = out、label、latlon、did、note
```

做好後不要按 ▶︎ 試，它會真的打卡，選「是」也會真的開 issue。要試就用 README 3.6 的「測試」。

## 注意

- 捷徑裡有 token，不要分享這些捷徑。
- token 一年後到期：做一個新的 token，換掉五個打卡捷徑裡的 `Authorization`（「在家嗎」沒有 token，不用換）。
