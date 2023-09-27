class colorAutoSelector{
    constructor(element,input,selector_holder,main_threshold=10,threshold=5,show_image = false,image_width,image_height){
        this.file = this.createElement('input',{'type':'file','name':'image_file'});
        this.canvas = this.createElement('canvas',{'id':'color-reader'});
        this.expandColors = this.createElement('div',{'id':'expand-colors'});
        this.element = element;
        this.image_display = false;
        this.img = null;
        if(selector_holder == null){
            this.colorSelector = this.createElement('div',{'id':'color-selections'});
            this.element.appendChild(this.colorSelector);
        }else{
            this.colorSelector = selector_holder;
        }
        if(this.width == null){
            image_width = image_height = this.element.offsetWidth;
        }
        this.width = image_width;
        this.height = image_height;
        this.colors = this.createElement('div',{'id':'colors'});
        this.ctx = this.canvas.getContext('2d');
        this.main_threshold = main_threshold;
        this.threshold = threshold;
        this.canvasDrawUpdate = null;
        this.interval = null;
        this.input = input;
        this.mouseDown = false;
        this.img_color = null;

        this.canvas.addEventListener('mousemove',function(el){
            if(this.mouseDown && this.img_color != null){
                this.getColor(el.offsetX,el.offsetY);
            }
        }.bind(this));
        this.canvas.addEventListener('mousedown',function(){
            this.mouseDown = true;
        }.bind(this));
        this.canvas.addEventListener('mouseup',function(){
            this.mouseDown = false;
        }.bind(this));
        
        this.element.appendChild(this.file);
        this.show_image = show_image;
        this.timeout = null;
        if(show_image){
            this.element.appendChild(this.canvas);
        }
        this.element.appendChild(this.colors);
        this.element.appendChild(this.expandColors);
        
        this.file.addEventListener('change',this.uploadFile.bind(this));
    }

    getColor(x,y){
        this.displayImage();
        var index = (x*4) + (y*(this.canvas.width * 4));
        var colors = this.img_color.data;
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgb('+colors[index]+','+colors[index+1]+','+colors[index+2]+')';
        this.ctx.arc(x,y,20,0,Math.PI*2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    displayImage(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.drawImage(this.img,0,0,this.canvas.width,this.canvas.height);
    }

    uploadFile(){
        var img = new Image();
        var t = URL.createObjectURL(this.file.files[0]);
        img.src = t;
        
        img.addEventListener('load',function(el){
            this.img = img;
            this.colors.innerHTML = 'Loading...';
            var colors = {};
            var width = img.width;
            var height = img.height;
            if(!this.show_image){
                this.canvas.style.display = 'none';
            }
            var ratio = 0;
            if(width > height){
                ratio = height/width;
                this.canvas.width = this.width;
                this.canvas.height = this.height*ratio;
            }else{
                ratio = width/height;
                this.canvas.width = this.width*ratio;
                this.canvas.height = this.height;
            }
            this.img = img;
            
            this.ctx.drawImage(img,0,0,width,height,0,0,this.canvas.width,this.canvas.height);
            var imageData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
            this.img_color = imageData;
            colors = this.setupChanges(imageData);
            //console.log(colors);
            //this.hideButtons();
            //colors = this.optimize(colors);
            this.extractColors(colors,img,this.colors,this.expandColors);
            
            //this.interval = this.traverseThrough(this.interval,img,this.main_threshold,this.threshold);
        }.bind(this));
    }

    createElement(type,attr){
        var el = document.createElement(type);
        for(var a in attr){
            el[a] = attr[a];
        }
        return el;
    }

    createCanvas(colors){
        var ctx_holder = colors.image.getContext('2d');
        for(var i = 0; i < colors.colors.length-1; ++i){
            /*var data = colors.colors[i];
            var index_holder = data[3];
            var row = (index_holder/4)/canvas.width;
            //var x = row-Math.floor(row);
            ctx_holder.fillStyle = 'rgb(255,255,255)';
            //ctx_holder.fillStyle = 'rgb('+data[0]+','+data[1]+','+data[2]+')';
            ctx_holder.rect(0,0,1,1);
            ctx_holder.fill();*/
        }
        /*var image = new Image();
        image.src = URL.createObjectURL(ctx_holder.getImageData(0,0,colors.image.width,colors.image.height).data);
        document.getElementById('image-holder').appendChild(image);*/
    }

    showImage(img){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.drawImage(img,0,0,img.width,img.height,0,0,this.canvas.width,this.canvas.height);
    }

    updateCanvasDraw(index_data,colors,img){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        var color_holder = colors[index_data].colors;
        var radian = Math.PI*2;
        for(var i in color_holder){
            var data = color_holder[i];
            if(data[0] > 100){
                this.ctx.fillStyle = 'rgba(255,255,255,.5)';
            }else{
                this.ctx.fillStyle = 'rgba(100,255,100,.5)';
            }
            //this.ctx.fillStyle = 'rgb('+data[0]+','+data[1]+','+data[2]+')';
            this.ctx.beginPath();
            this.ctx.fillRect(data[4],data[5],1,1);
        }
        this.image_displaying = false;
        var worker = new Worker('../../assets/js/color_selector/optimize.js');
        worker.postMessage({colors:colors,index_data:index_data,colors:colors});
        //this.ctx.drawImage(img,0,0,img.width,img.height,0,0,this.canvas.width,this.canvas.height);
        //var x = colors.image.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
        //ctx.drawImage(colors.image,0,0,canvas.width,canvas.height);
        
    }

    optimize(colors){
        var optimize = [];
        var colors_holder = [];
        for(var i in colors){
            for(var m in colors[i].colors){
                var str_size = colors[i].colors[m][0];
                if(typeof optimize[colors[i].colors[m][0]] == 'undefined'){
                    optimize[colors[i].colors[m][0]] = [colors[i].colors[m][1],colors[i].colors[m][2],i,m];
                    colors_holder[colors[i].colors[m][0]] = [colors[i].colors[m][1],colors[i].colors[m][2],i,m]
                    for(var l = 0; l < 10; ++l){
                        optimize[colors[i].colors[m][0]+l] = [colors[i].colors[m][0],colors[i].colors[m][0]];
                    }
                }else{
                    delete(colors[i].colors[m]);
                }
            }
        }
        return colors;
    }

    createDivsFromColors(colors,colors_holder,sub_holder){
        var keys = Object.keys(colors);
        if(colors[keys[0]].colors != null){
            for(var i in colors){
                var base_color = colors[i].colors;
                var div = document.createElement('div');
                div.data = i;
                div.style.background = 'rgb('+base_color[0][0]+','+base_color[0][1]+','+base_color[0][2]+')';
                if(i > 100) div.style.color = '#000';
                colors_holder.appendChild(div);
                div.addEventListener('click',function(el){
                    sub_holder.innerHTML = 'Processing...';
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(function(){
                        if(sub_holder != null){
                            this.updateCanvasDraw(el.target.data,colors,this.img);
                            this.createDivsFromColors(colors[el.target.data].colors,sub_holder);
                        }
                    }.bind(this),10);
                }.bind(this));
            }
        }else{
            var colors_info = {};
            for(var i in colors){
                colors_info = this.checkIfExists(colors_info,colors[i],i,this.threshold);
            }
            colors_holder.innerHTML = '';
            this.displayColorArray(colors_info,colors_holder);
        }
    }

    displayColorArray(colors_info,colors_holder){
        for(var v in colors_info){
            var base_color = colors_info[v];
            base_color.colors = this.order(base_color.colors);
            for(var r in base_color.colors){
                for(var g in base_color.colors[r]){
                    for(var b in base_color.colors[r][g]){
                        var div = document.createElement('div');
                        div.data = v;
                        div.style.background = 'rgb('+r+','+g+','+base_color.colors[r][g][b]+')';
                        colors_holder.appendChild(div);
                        div.addEventListener('click',function(el){
                            this.colorSelector.appendChild(el.currentTarget.cloneNode());
                            var colors = el.currentTarget.style.background.replace('rgb(','').replace(')','').split(',');
                            this.input.value = this.input.value+'|'+colors[0]+','+colors[1]+','+colors[2];
                        }.bind(this));
                    }
                }
            }
        }
    }

    extractColors(colors,img,holder,sub_holder){
        var colors_holder = holder;
            colors_holder.innerHTML = '';
        this.createDivsFromColors(colors,colors_holder,sub_holder);
    }

    checkIfExists(colors,data,index,threshold = this.threshold,duplicate=false){
        var low = data[2]-threshold;
        var high = data[2]+threshold;
        var exists = -1;
        for(;low < high;++low){
            if(typeof colors[low] !== 'undefined'){
                exists = low;
                break;
            }
        }
        
        var row = (index/4)/this.canvas.width;
        var x = (row-Math.floor(row))*this.canvas.width;

        if(exists == -1){
            colors[data[2]] = {'total':0,colors:[]};
            colors[data[2]].total++;
            
            colors[data[2]].colors.push([data[0],data[1],data[2],index,x,Math.floor(row)]);
        }else{
            if(!duplicate){
                var duplicate = [false,false,false];
                for(var i in colors[exists].colors){
                    duplicate[0] = this.checkIfDuplicate(colors[exists].colors[i][0],data[0]);
                    duplicate[1] = this.checkIfDuplicate(colors[exists].colors[i][1],data[1]);
                    duplicate[2] = this.checkIfDuplicate(colors[exists].colors[i][2],data[2]);
                }
                if(!duplicate[0] && !duplicate[1] && !duplicate[2]){
                    colors[exists].total++;
                    colors[exists].colors.push([data[0],data[1],data[2],index,x,Math.floor(row)]);
                }
            }else{
                colors[exists].total++;
                colors[exists].colors.push([data[0],data[1],data[2],index,x,Math.floor(row)]);
            }
        }
        return colors;
    }

    order(color){
        var order = {};
        for(var i in color){
            if(order[color[i][0]] == null) order[color[i][0]] = {};
            order[color[i][0]] = Object.keys(order[color[i][0]]).reduce((accumulator, currentValue) => {
                accumulator[currentValue] = order[color[i][0]][currentValue];
                return accumulator;
              }, {});
            if(order[color[i][0]][color[i][1]] == null) order[color[i][0]][color[i][1]] = [];
            order[color[i][0]][color[i][1]].push(color[i][2]);
            order[color[i][0]][color[i][1]].sort();
        }
        return order;
    }

    checkIfDuplicate(color,data){
        var duplicate = false;
        if(color == data){
            duplicate = true;
            return duplicate;
        }
        if(!duplicate){
            for(var v = -3; v < 3;v++){
                if(color+v == data){
                    duplicate = true;
                    break;
                }
            }
        }
        return duplicate;
    }

    autoSelect(){

    }

    showButtons(){
        this.expandColors.style.display = 'block';
        this.colors.style.display = 'block';
        this.colorSelector.style.display = 'block';
    }

    hideButtons(){
        this.colorSelector.style.display = 'none';
        this.expandColors.style.display = 'none';
        this.colors.style.display = 'none';
    }

    setupTree(imageData){
        var info = null;
        for(var i = 0; i < imageData.data.length-1; ++i){
            if(info == null){
                info = new rgb(imageData.data[i+1],imageData.data[i+2],imageData.data[i+3],i);
            }else{
                info.insert(imageData.data[i+1],imageData.data[i+2],imageData.data[i+3],i);
            }
            i = i+3;
        }
        return info;
    }

    traverseThrough(interval,img,main_threshold,threshold){
        var divs = document.getElementById('colors').getElementsByTagName('div');
        var i = 0;
        this.main_threshold = 1;
        this.threshold = 1;
        clearInterval(interval);
        interval = setInterval(function(){
            divs[i].click();
            ++i;
            if(i > divs.length-1){
                this.main_threshold = main_threshold;
                this.threshold = threshold;
                clearInterval(interval);
                this.showButtons();
                this.showImage(img);
            };
        }.bind(this),10);
        return interval;
    }

    setupChanges(imageData){
        var colors = {};
        for(var i = 0; i < imageData.data.length-1; ++i){
            var data = [imageData.data[i],imageData.data[i+1],imageData.data[i+2],imageData.data[i+3]];
            if(typeof colors[data[0]] === 'undefined'){
                colors = this.checkIfExists(colors,data,i,this.main_threshold,true);
            }else{
                colors = this.checkIfExists(colors,data,i,this.main_threshold,true);
            }
            i = i+3;
        }
        return colors;
    }
}
