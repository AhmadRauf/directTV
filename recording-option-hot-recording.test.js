import { assert } from "chai";
// eslint-disable-next-line no-unused-vars
import {
  getPageSourceEtree,
  scrollPageDown,
  tapOnSelectedTextSingle,
  isDisplayed,
} from "../../../utils/appium.utils";
import { cancelAllRecordingOptions,} from '../../../utils/steps.js';

import NavigationPage from "../../../pageobjects/navigation.page";
import CommonInfoPage from "../../../pageobjects/common-info.page";
import VideoPlayerPage from "../../../pageobjects/video-player.page";
import SearchPage from "../../../pageobjects/search.page";
import RecordingOSDPage from "../../../pageobjects/recording-osd.page.js";
import RecordOptionsDrawerPage from "../../../pageobjects/record-options-drawer.page";
import { sendStepLog } from "../../../utils/report.utils";
import { values } from "../../../utils/constants.js";

const reportportal = require("wdio-reportportal-reporter");
reportportal.addAttribute({ key: "author", value: "dgl474u" });
reportportal.addAttribute({ key: "group", value: values.Team_CAT });

const { SPORTSCAROUSELARRAYMU } = values;

describe("Team Recordings: Hot Recording", () => {
  it("https://jira.dtveng.net/browse/OVPHX-10385 M/T", function () {

    sendStepLog(1, "Navigate to Search");
    VideoPlayerPage.waitForStream();
    let count = 0,
      found = false,
      firstMatchIndex,
      switchEtree;
    const MAX_RETRIES = 20;

    sendStepLog(
      2,
      "Search through vetted sport leagues and sport event in search results that does not need to be subscribed and has no play icon"
    );
    NavigationPage.clickOnSearch();
    SearchPage.waitForPageToLoad();

    while (count < SPORTSCAROUSELARRAYMU.length && !found) {
      const seTeamRecordingItem = SPORTSCAROUSELARRAYMU[count];
      SearchPage.sendTextToSearch(seTeamRecordingItem);

      for (
        let i = 0, switchPageSource, previousPageSource;
        i < MAX_RETRIES &&
        (switchPageSource == null || previousPageSource !== switchPageSource);
        i++
      ) {
        previousPageSource = switchPageSource;
        switchPageSource = SearchPage.getPageSource();
        switchEtree = getPageSourceEtree(switchPageSource);

        const mappedResult = SearchPage.getMappedSearchResultArray(switchEtree);
        firstMatchIndex = getIndexNoPlayIconAndNoSubIcon(mappedResult);

        if (firstMatchIndex >= 0) {
          found = true;
          break;
        } else {
          scrollPageDown();
        }
      }
      count++;
    }
    if (!found) {
      sendStepLog("Could not find content to test");
      this.skip();
    }
    sendStepLog(3, "Enter common info page");
    tapOnSelectedTextSingle(
      SearchPage.listSearchTitleTouchArea,
      firstMatchIndex + 1
    );
    CommonInfoPage.waitForContentTitleToLoad();
    assert(CommonInfoPage.hasRecordOptions(), "should have Record Options");

    sendStepLog(4, "Click on record Options to open Record Options Drawer");
    CommonInfoPage.clickRecordOptions();
    CommonInfoPage.waitForRecordOptionsDrawer();
    const successfulCancel = cancelAllRecordingOptions();
    assert(successfulCancel, 'cancel all recording should be successful');
    const recordOptionsMainText = CommonInfoPage.getDrawerMainText();
    assert(recordOptionsMainText[0] === 'Record This Game', 'should be able to record');

    sendStepLog(5, "Select the Record This Game and verify that REC CTA appears");

    RecordOptionsDrawerPage.clickOnRecordOptionMainText(0);
    assert.isTrue(RecordingOSDPage.isRecordingOSDDisplayed(), 'Recording modal did not appear');
    RecordingOSDPage.clickHeaderText();
    assert.isTrue(isDisplayed(CommonInfoPage.recordingImage));

    sendStepLog(6 , "Select the Record Team and verify that REC CTA still appears");

    CommonInfoPage.clickRecordOptions();
    CommonInfoPage.waitForRecordOptionsDrawer();
    RecordOptionsDrawerPage.clickOnRecordOptionMainText(1);
    assert.isTrue(RecordingOSDPage.isRecordingOSDDisplayed(), 'Recording modal did not appear');
    RecordingOSDPage.clickHeaderText();
    assert.isTrue(isDisplayed(CommonInfoPage.recordingImage));

    sendStepLog(7 , "Stop record team and verify that REC CTA still remains");

    CommonInfoPage.clickRecordOptions();
    CommonInfoPage.waitForRecordOptionsDrawer();
    RecordOptionsDrawerPage.clickOnRecordOptionMainText(1);
    assert.isTrue(isDisplayed(CommonInfoPage.recordingImage));

  });
});

function getIndexNoPlayIconAndNoSubIcon(mappedResult) {
  return mappedResult.reduce(
    (p, n, ci) => (p < 0 && !n.playicon && !n.sub && n.element != null ? ci : p),
    -1
  );
}
