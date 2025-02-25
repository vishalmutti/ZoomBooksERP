import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImportantLinksPage() {
  return (
    <Tabs defaultValue="british-columbia" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="british-columbia">British Columbia</TabsTrigger>
        <TabsTrigger value="ontario">Ontario</TabsTrigger>
        <TabsTrigger value="library-link">Library Link</TabsTrigger>
        <TabsTrigger value="training">Training</TabsTrigger>
      </TabsList>
      <TabsContent value="british-columbia">
        <ul>
          <li>
            <a href="https://docs.google.com/spreadsheets/d/1Y6zUOxey5xUA2fyEa-YIFhRg2B4Aa5pRnokZJAuln_c/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
              Incoming Loads
            </a>
          </li>
          <li>
            <a href="https://docs.google.com/spreadsheets/d/1ErMX4XN_F8x92L_PmFj-XjP7grf_HYp8GVrA_dbQKhE/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
              Wholesale
            </a>
          </li>
          <li>
            <a href="https://zoombooks.lkdev.com/" target="_blank" rel="noopener noreferrer">
              Prescan CashMonkey
            </a>
          </li>
          <li>
            <a href="https://list.lkdev.com/" target="_blank" rel="noopener noreferrer">
              Cashmonkey Site (select account 168)
            </a>
          </li>
          <li>
            <a href="https://ultrapricer.lkdev.com/dashboard.php" target="_blank" rel="noopener noreferrer">
              Cashmonkey Repricing Window
            </a>
          </li>
          <li>
            <a href="https://prod-useast-b.online.tableau.com/#/site/amerifoliollc/workbooks/520123/customViews" target="_blank" rel="noopener noreferrer">
              Tableau Data
            </a>
          </li>
          <li>
            <a href="https://docs.google.com/spreadsheets/d/1euvZO0q0jNVdZGqegetS2fwLGL0xlXQO58Mi8MGVYB8/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
              Google Sheet Conveyor Management
            </a>
          </li>
        </ul>
      </TabsContent>
      <TabsContent value="ontario">
        <p>Content for Ontario</p>
      </TabsContent>
      <TabsContent value="library-link">
        <p>Content for Library Link</p>
      </TabsContent>
      <TabsContent value="training">
        <p>Content for Training</p>
      </TabsContent>
    </Tabs>
  );
}
