return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {currentView === ViewState.DASHBOARD && <Dashboard />}
          {currentView === ViewState.INVENTORY && <Inventory />}
          {currentView === ViewState.POS && <POS />}
          {currentView === ViewState.REMITOS && <Remitos />}
          {currentView === ViewState.PRESUPUESTOS && <Presupuestos />}
          {currentView === ViewState.CLIENTS && <Clients />}
          {currentView === ViewState.PURCHASES && <Purchases />}
          {currentView === ViewState.TREASURY && <Treasury />}
          {currentView === ViewState.ACCOUNTING && <Accounting />}
          {currentView === ViewState.STATISTICS && <Statistics />}
          {currentView === ViewState.REPORTS && <Reports />}
          {currentView === ViewState.BACKUP && <Backup />}
          {currentView === ViewState.BRANCHES && <Branches />}
          {currentView === ViewState.AI_ASSISTANT && <Assistant />}
          {currentView === ViewState.PRICE_UPDATES && <PriceUpdates />}
          {currentView === ViewState.USERS && <UsersComponent />}
          {currentView === ViewState.REPLENISHMENT && <Replenishment />}
          {currentView === ViewState.SHORTAGES && <Shortages />}
          {currentView === ViewState.SALES_ORDERS && <SalesOrders />}
          {currentView === ViewState.ONLINE_SALES && <OnlineSales />}
          {currentView === ViewState.PRINT_CONFIG && <PrintSettings />}
          {currentView === ViewState.LABEL_PRINTING && <LabelPrinting />}
          {currentView === ViewState.COMPANY_SETTINGS && <CompanySettings />}
          {currentView === ViewState.AFIP_CONFIG && <AfipConfig />}
          {currentView === ViewState.CUSTOMER_PORTAL && <CustomerPortal />}
        </main>
      </div>
    </div>
  );
};

export default App;