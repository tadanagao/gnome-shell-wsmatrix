const WsMatrix = imports.misc.extensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const DisplayWrapper = WsMatrix.imports.DisplayWrapper.DisplayWrapper;
const WorkspacesDisplayOverride = WsMatrix.imports.WorkspacesDisplayOverride.WorkspacesDisplayOverride;
const WsmatrixThumbnailsBox = WsMatrix.imports.WsmatrixThumbnailsBox.WsmatrixThumbnailsBox;
const ThumbnailsBox = imports.ui.workspaceThumbnail.ThumbnailsBox;
const { GObject } = imports.gi;

var OverviewOverride = class {
   constructor(settings, keybindings) {
      this.wm = Main.wm;
      this.settings = settings;
      this.wsManager = DisplayWrapper.getWorkspaceManager();
      this._keybindings = keybindings;
      this._overrideActive = false;
      this._originalThumbnailsBox = null;
      this._wsmatrixThumbnailsBox = null;
      this._thumbnailsBoxOverride = null;
      this._workspacesDisplayOverride = null;

      this._handleNumberOfWorkspacesChanged();
      this._connectSettings();
      this._handleShowOverviewGridChanged();
   }

   destroy() {
      this._disconnectSettings();
      if (this._overrideActive) {
         this._deactivateOverride();
      }
   }

   _connectSettings() {
      this.settingsHandlerRows = this.settings.connect(
         'changed::num-rows',
         this._handleNumberOfWorkspacesChanged.bind(this)
      );

      this.settingsHandlerColumns = this.settings.connect(
         'changed::num-columns',
         this._handleNumberOfWorkspacesChanged.bind(this)
      );

      this.settingsHandlerShowOverviewGrid = this.settings.connect(
         'changed::show-overview-grid',
         this._handleShowOverviewGridChanged.bind(this)
      );
   }

   _disconnectSettings() {
      this.settings.disconnect(this.settingsHandlerRows);
      this.settings.disconnect(this.settingsHandlerColumns);
      this.settings.disconnect(this.settingsHandlerShowOverviewGrid);
   }

   _handleNumberOfWorkspacesChanged() {
      this.rows = this.settings.get_int('num-rows');
      this.columns = this.settings.get_int('num-columns');

      if (this._wsmatrixThumbnailsBox) {
         this._wsmatrixThumbnailsBox.setRows(this.rows);
         this._wsmatrixThumbnailsBox.setColumns(this.columns);
      }
   }

   _handleShowOverviewGridChanged() {
      this.showOverviewGrid = this.settings.get_boolean('show-overview-grid');

      if (this.showOverviewGrid && !this._overrideActive) {
         this._activateOveride();
      }

      if (!this.showOverviewGrid && this._overrideActive) {
         this._deactivateOverride();
      }
   }

   _activateOveride() {
      this._overrideActive = true;
      let workspacesDisplay = Main.overview._controls.viewSelector._workspacesDisplay;
      this._workspacesDisplayOverride = new WorkspacesDisplayOverride(workspacesDisplay);

      this._originalThumbnailsBox = Main.overview._controls._thumbnailsBox;
      this._wsmatrixThumbnailsBox = new WsmatrixThumbnailsBox(this.rows, this.columns);

      Main.overview._controls._thumbnailsBox = this._wsmatrixThumbnailsBox;
      let thumbnailsSlider = Main.overview._controls._thumbnailsSlider;
      thumbnailsSlider._thumbnailsBox = this._wsmatrixThumbnailsBox;
      thumbnailsSlider.actor.replace_child(
         this._originalThumbnailsBox,
         this._wsmatrixThumbnailsBox
      );
      this._wsmatrixThumbnailsBox.bind_property('visible', thumbnailsSlider.actor, 'visible', GObject.BindingFlags.SYNC_CREATE);
   }

   _deactivateOverride() {
      this._overrideActive = false;
      this._workspacesDisplayOverride.destroy();
      this._workspacesDisplayOverride = null;

      this._originalThumbnailsBox = new ThumbnailsBox();
      Main.overview._controls._thumbnailsBox = this._originalThumbnailsBox;
      let thumbnailsSlider = Main.overview._controls._thumbnailsSlider;
      thumbnailsSlider._thumbnailsBox = this._originalThumbnailsBox;
      thumbnailsSlider.actor.replace_child(
         this._wsmatrixThumbnailsBox,
         this._originalThumbnailsBox
      );

      this._wsmatrixThumbnailsBox.destroy();
      this._wsmatrixThumbnailsBox = null;
      this._originalThumbnailsBox = null;
   }
}
