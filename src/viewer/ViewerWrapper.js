function ViewerWrapper(dataUrl, target, base64, options) {
    this.dataUrl = dataUrl;
    this.target = target;
    this.base64 = base64;
    this.options = options;
    this.threeEditor = undefined;


    /*
     * Private functions
     */

    function createImageContainer() {
        var container = new UI.Panel().setId("main-image");
        container.setPosition('absolute');
        container.setTop('0px');
        container.setLeft('0px');
        container.setRight('0px');
        container.setBottom('0px');
        return container;
    }

    var init = function ($this) {
        var container = createImageContainer();
        $this.image = new UI.Image($this.base64, function () {
            $this.target.removeChild(document.getElementById("main-image"));
            $this.viewer = new Viewer($this.target, options);
            $.getJSON($this.dataUrl, function (json) {
                $this.viewer.reloadModel(json)
            });

        });
        container.add($this.image);
        $this.target.append(container.dom);
    };

    ViewerWrapper.prototype.returnToImageView = function () {
        var container = createImageContainer();
        var $this = this;

        $this.image = new UI.Image($this.base64, function () {
            $this.target.removeChild(document.getElementById("main-image"));
            if(!$this.viewer){
                $this.viewer = new Viewer($this.target, options);
            }
            $.getJSON($this.dataUrl, function (json) {
                $this.viewer.reloadModel(json)
            });

        });
        container.add($this.image);
        $this.target.append(container.dom);
    };

    ViewerWrapper.prototype.changeImageInImageView = function () {
        if(this.viewer){
            var renderer = this.viewer.viewport.renderer;
            if(renderer){
                this.base64	= renderer.domElement.toDataURL("image/png");
            }
        }
    };


    init(this);
}
