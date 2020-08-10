/*
 *    Copyright (c) 2017, The OpenThread Authors.
 *    All rights reserved.
 *
 *    Redistribution and use in source and binary forms, with or without
 *    modification, are permitted provided that the following conditions are met:
 *    1. Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *    2. Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *    3. Neither the name of the copyright holder nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 *    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *    ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *    INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *    CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *    ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *    POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
    angular
        .module('StarterApp', ['ngMaterial', 'ngMessages'])
        .controller('AppCtrl', AppCtrl)
        .service('sharedProperties', function() {
            var index = 0;
            var networkInfo;

            return {
                getIndex: function() {
                    return index;
                },
                setIndex: function(value) {
                    index = value;
                },
                getNetworkInfo: function() {
                    return networkInfo;
                },
                setNetworkInfo: function(value) {
                    networkInfo = value
                },
            };
        });

    function AppCtrl($scope, $http, $mdDialog, $interval, sharedProperties) {
        $scope.menu = [{
                title: 'Home',
                icon: 'home',
                show: true,
            },
            {
                title: 'Join',
                icon: 'add_circle_outline',
                show: false,
            },
            {
                title: 'Form',
                icon: 'open_in_new',
                show: false,
            },
            {
                title: 'Status',
                icon: 'info_outline',
                show: false,
            },
            {
                title: 'Settings',
                icon: 'settings',
                show: false,
            },
            {
                title: 'Commission',
                icon: 'add_circle_outline',
                show: false,
            },
            {
                title: 'Topology',
                icon: 'add_circle_outline',
                show: false,
            },

        ];

        $scope.thread = {
            networkName: 'OpenThreadDemo',
            extPanId: '1111111122222222',
            panId: '0x1234',
            passphrase: '123456',
            networkKey: '00112233445566778899aabbccddeeff',
            channel: 15,
            prefix: 'fd11:22::',
            defaultRoute: true,
        };

        $scope.setting = {
            prefix: 'fd11:22::',
            defaultRoute: true,
        };

        $scope.headerTitle = 'Home';
        $scope.status = [];

        $scope.isLoading = false;

        $scope.showScanAlert = function(ev) {
            $mdDialog.show(
                $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Information')
                .textContent('There is no available Thread network currently, please \
                             wait a moment and retry it.')
                .ariaLabel('Alert Dialog Demo')
                .ok('Okay')
            );
        };
        $scope.showPanels = function(index) {
            $scope.headerTitle = $scope.menu[index].title;
            for (var i = 0; i < 7; i++) {
                $scope.menu[i].show = false;
            }
            $scope.menu[index].show = true;
            if (index == 1) {
                $scope.isLoading = true;
                $http.get('/available_network').then(function(response) {
                    $scope.isLoading = false;
                    if (response.data.error == 0) {
                        $scope.networksInfo = response.data.result;
                    } else {
                        $scope.showScanAlert(event);
                    }
                });
            }
            if (index == 3) {
                $http.get('/get_properties').then(function(response) {
                    console.log(response);
                    if (response.data.error == 0) {
                        var statusJson = response.data.result;
                        $scope.status = [];
                        for (var i = 0; i < Object.keys(statusJson).length; i++) {
                            $scope.status.push({
                                name: Object.keys(statusJson)[i],
                                value: statusJson[Object.keys(statusJson)[i]],
                                icon: 'res/img/icon-info.png',
                            });
                        }
                    }
                });
            }
            if (index == 6) {
                $scope.dataInit();
                $scope.showTopology()
            }
        };

        $scope.showJoinDialog = function(ev, index, item) {
            sharedProperties.setIndex(index);
            sharedProperties.setNetworkInfo(item);
            $scope.index = index;
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'join.dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: $scope.customFullscreen,
            });
        };

        function DialogController($scope, $mdDialog, $http, $interval, sharedProperties) {
            var index = sharedProperties.getIndex();
            var networkInfo = sharedProperties.getNetworkInfo();
            $scope.isDisplay = false;
            $scope.thread = {
                networkKey: '00112233445566778899aabbccddeeff',
                prefix: 'fd11:22::',
                defaultRoute: true,
            };

            $scope.showAlert = function(ev, result) {
                $mdDialog.show(
                    $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Information')
                    .textContent('Join operation is ' + result)
                    .ariaLabel('Alert Dialog Demo')
                    .ok('Okay')
                    .targetEvent(ev)
                );
            };

            $scope.join = function(valid) {
                if (!valid)
                {
                    return;
                }

                if ($scope.thread.defaultRoute == null) {
                    $scope.thread.defaultRoute = false;
                };
                $scope.isDisplay = true;
                var data = {
                    networkKey: $scope.thread.networkKey,
                    prefix: $scope.thread.prefix,
                    defaultRoute: $scope.thread.defaultRoute,
                    index: index,
                };
                var httpRequest = $http({
                    method: 'POST',
                    url: '/join_network',
                    data: data,
                });

                data = {
                    extPanId: networkInfo.xp,
                    networkName: networkInfo.nn,
                };
                httpRequest.then(function successCallback(response) {
                    $scope.res = response.data.result;
                    if (response.data.result == 'successful') {
                        $mdDialog.hide();
                    }
                    $scope.isDisplay = false;
                    $scope.showAlert(event, response.data.result);
                });
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        };


        $scope.showConfirm = function(ev, valid) {
            if (!valid)
            {
                return;
            }

            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to Form the Thread Network?')
                .textContent('')
                .targetEvent(ev)
                .ok('Okay')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                if ($scope.thread.defaultRoute == null) {
                    $scope.thread.defaultRoute = false;
                };
                var data = {
                    networkKey: $scope.thread.networkKey,
                    prefix: $scope.thread.prefix,
                    defaultRoute: $scope.thread.defaultRoute,
                    extPanId: $scope.thread.extPanId,
                    panId: $scope.thread.panId,
                    passphrase: $scope.thread.passphrase,
                    channel: $scope.thread.channel,
                    networkName: $scope.thread.networkName,
                };
                $scope.isForming = true;
                var httpRequest = $http({
                    method: 'POST',
                    url: '/form_network',
                    data: data,
                });

                data = {
                    extPanId: $scope.thread.extPanId,
                    networkName: $scope.thread.networkName,
                };
                httpRequest.then(function successCallback(response) {
                    $scope.res = response.data.result;
                    if (response.data.result == 'successful') {
                        $mdDialog.hide();
                    }
                    $scope.isForming = false;
                    $scope.showAlert(event, 'FORM', response.data.result);
                });
            }, function() {
                $mdDialog.cancel();
            });
        };

        $scope.showAlert = function(ev, operation, result) {
            $mdDialog.show(
                $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Information')
                .textContent(operation + ' operation is ' + result)
                .ariaLabel('Alert Dialog Demo')
                .ok('Okay')
                .targetEvent(ev)
            );
        };

        $scope.showAddConfirm = function(ev) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to Add this On-Mesh Prefix?')
                .textContent('')
                .targetEvent(ev)
                .ok('Okay')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                if ($scope.setting.defaultRoute == null) {
                    $scope.setting.defaultRoute = false;
                };
                var data = {
                    prefix: $scope.setting.prefix,
                    defaultRoute: $scope.setting.defaultRoute,
                };
                var httpRequest = $http({
                    method: 'POST',
                    url: '/add_prefix',
                    data: data,
                });

                httpRequest.then(function successCallback(response) {
                    $scope.showAlert(event, 'Add', response.data.result);
                });
            }, function() {
                $mdDialog.cancel();
            });
        };

        $scope.showDeleteConfirm = function(ev) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to Delete this On-Mesh Prefix?')
                .textContent('')
                .targetEvent(ev)
                .ok('Okay')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                var data = {
                    prefix: $scope.setting.prefix,
                };
                var httpRequest = $http({
                    method: 'POST',
                    url: '/delete_prefix',
                    data: data,
                });

                httpRequest.then(function successCallback(response) {
                    $scope.showAlert(event, 'Delete', response.data.result);
                });
            }, function() {
                $mdDialog.cancel();
            });
        };

        $scope.startCommission = function(ev) {
            var data = {
                pskd: $scope.commission.pskd,
                passphrase: $scope.commission.passphrase,
            };
            var httpRequest = $http({
                method: 'POST',
                url: '/commission',
                data: data,
            });
            
            ev.target.disabled = true;
            
            httpRequest.then(function successCallback(response) {
                if (response.data.error == 0) {
                    $scope.showAlert(event, 'Commission', 'success');
                } else {
                    $scope.showAlert(event, 'Commission', 'failed');
                }
                ev.target.disabled = false;
            });
        };

        $scope.restServerPort = '8081';
        $scope.ipAddr = window.location.hostname + ':' + $scope.restServerPort;

        // tooltipbasic information line
        $scope.basicInfo = {
            'NetworkName' : 'Unknown',
            'LeaderData'  :{'LeaderRouterId' : 'Unknown'}
        }
        // tooltipnum of router calculated by diagnostic
        $scope.NumOfRouter = 'Unknown';

        // tooltipdiagnostic information for detailed display
        $scope.nodeDetailInfo = 'Unknown';
        // tooltipfor response of Diagnostic
        $scope.networksDiagInfo = '';
        $scope.graphisReady = false;
        $scope.detailList = {
            'ExtAddress': { 'title': false, 'content': true },
            'Rloc16': { 'title': false, 'content': true },
            'Mode': { 'title': false, 'content': false },
            'Connectivity': { 'title': false, 'content': false },
            'Route': { 'title': false, 'content': false },
            'LeaderData': { 'title': false, 'content': false },
            'NetworkData': { 'title': false, 'content': true },
            'IP6Address List': { 'title': false, 'content': true },
            'MACCounters': { 'title': false, 'content': false },
            'ChildTable': { 'title': false, 'content': false },
            'ChannelPages': { 'title': false, 'content': false }
        };
        $scope.graphInfo = {
            'nodes': [],
            'links': []
        }

        $scope.dataInit = function() {

            $http.get('http://' + $scope.ipAddr + '/node').then(function(response) {

                $scope.basicInfo = response.data;
                console.log(response.data);
                $scope.basicInfo.Rloc16 = $scope.intToHexString($scope.basicInfo.Rloc16,4);
                $scope.basicInfo.LeaderData.LeaderRouterId = '0x' + $scope.intToHexString($scope.basicInfo.LeaderData.LeaderRouterId,2);
            });
        }
        $scope.isObject = function(v) {
            return v.constructor === Object;
        }
        $scope.isArray = function(v) {
            return !!v && v.constructor === Array;
        }

        $scope.clickList = function(key) {
            $scope.detailList[key]['content'] = !$scope.detailList[key]['content']
        }

        $scope.nodeChoose = function() {
            const hide = e => e.style.display = 'none';
            const show = e => e.style.display = ''
            document.querySelectorAll('#Leader').forEach(e => e.style.display ? show(e) : hide(e))
        }
        $scope.intToHexString = function( num , len){
            var value;
            value  = num.toString(16);
            
            while( value.length < len ){
                value = '0' + value;
            }
            return value;
        }
        $scope.showTopology = function() {
            var nodeMap = {}
            var count, src, dist, rloc, child, rlocOfParent, rlocOfChild;

            $scope.graphisReady = false;
            $scope.graphInfo = {
                'nodes': [],
                'links': []
            };
            $http.get('http://' + $scope.ipAddr + '/diagnostics').then(function(response) {

                
                $scope.networksDiagInfo = response.data;
                console.log(response.data);
                for (var x of $scope.networksDiagInfo){
                    console.log(x);
                    
                    x['RouteId'] = '0x' + $scope.intToHexString(x['Rloc16'] >> 10,2);
                    
                    x['Rloc16'] = '0x' + $scope.intToHexString(x['Rloc16'],4);
                    
                    x['LeaderData']['LeaderRouterId'] = '0x' + $scope.intToHexString(x['LeaderData']['LeaderRouterId'],2);
                    console.log(x['LeaderData']['LeaderRouterId']);
                    for (var z of x['Route']['RouteData']){
                        
                        z['RouteId'] = '0x' + $scope.intToHexString(z['RouteId'],2);
                    }
                    
                }
                
                count = 0;
                
                for (var x of $scope.networksDiagInfo) {
                    if ('ChildTable' in x) {
                        
                        rloc = parseInt(x['Rloc16'],16).toString(16);
                        nodeMap[rloc] = count;
                        
                        if ( x['RouteId'] == x['LeaderData']['LeaderRouterId']) {
                            x['Role'] = 'Leader';
                        } else {
                            x['Role'] = 'Router';
                        }

                        $scope.graphInfo.nodes.push(x);
                        
                        if (x['Rloc16'] === $scope.basicInfo.rloc16) {
                            $scope.nodeDetailInfo = x
                        }
                        count = count + 1;
                    }
                }
                // tooltip num of Router is based on the diagnostic information
                $scope.NumOfRouter = count;
                
                // tooltip index for a second loop
                src = 0;
                // tooltip construct links 
                for (var y of $scope.networksDiagInfo) {
                    if ('ChildTable' in y) {
                        // tooltip link bewtwen routers
                        for (var z of y['Route']['RouteData']) {
                            rloc = ( parseInt(z['RouteId'],16) << 10).toString(16);
                            if (rloc in nodeMap) {
                                dist = nodeMap[rloc];
                                if (src < dist) {
                                    $scope.graphInfo.links.push({
                                        'source': src,
                                        'target': dist,
                                        'weight': 1,
                                        'type': 0,
                                        'linkInfo': {
                                            'inQuality': z['LinkQualityIn'],
                                            'outQuality': z['LinkQualityOut']
                                        }
                                    });
                                }
                            }
                        }

                        // tooltiplink between router and child 
                        for (var n of y['ChildTable']) {
                            child = {};
                            rlocOfParent = parseInt(y['Rloc16'],16).toString(16);
                            rlocOfChild = (parseInt(y['Rloc16'],16) + n['ChildId']).toString(16);

                            src = nodeMap[rlocOfParent];
                            
                            child['Rloc16'] = '0x' + rlocOfChild;
                            child['RouteId'] = y['RouteId'];
                            nodeMap[rlocOfChild] = count;
                            child['Role'] = 'Child';
                            $scope.graphInfo.nodes.push(child);
                            $scope.graphInfo.links.push({
                                'source': src,
                                'target': count,
                                'weight': 1,
                                'type': 1,
                                'linkInfo': {
                                    'Timeout': n['Timeout'],
                                    'Mode': n['Mode']
                                }

                            });

                            count = count + 1;
                        }
                    }
                    src = src + 1;
                }
               
                $scope.drawGraph();
            })
        }

        
        $scope.updateDetailLabel = function() {
            for (var x in $scope.detailList) {
                $scope.detailList[x]['title'] = false;
            }
            for (var y in $scope.nodeDetailInfo) {

                if (y in $scope.detailList) {
                    $scope.detailList[y]['title'] = true;
                }

            }
        }

        
        $scope.drawGraph = function() {
            function dragstarted(d) {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              }
              
            function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
              }
              
            function dragended(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              }

            // tooltiperase former graph
            document.getElementById('topograph').innerHTML = '';
            scale = $scope.graphInfo.nodes.length;
            len = 125 * Math.sqrt(scale);
            json = $scope.graphInfo;

            //tooltipblur for node
            
            var tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                
                .style('position', 'absolute')
                .style('z-index', '10')
                .style('visibility', 'hidden')
                .text('a simple tooltip');
            
            const simulation = d3.forceSimulation()
                .force("charge", d3.forceManyBody())
               
                .force("link", d3.forceLink().distance(40))
                .force("center", d3.forceCenter(len/2, len /3))
                
            const svg = d3.select('.d3graph').append('svg')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                
                .attr('viewBox', [0,0,len,len/(3/2)].join(' ')) // tooltipclass to make it responsive
                .append('g');
            
                // Legend
                svg.append('circle')
                .attr('cx',len-20)
                .attr('cy',10).attr('r', 3)
                .style('fill', "#7e77f8")
                .style('stroke', '#484e46')
                .style('stroke-width', '0.4px');
                
                svg.append('circle')
                .attr("cx",len-20)
                .attr('cy',20)
                .attr('r', 3)
                .style('fill', '#03e2dd')
                .style('stroke', '#484e46')
                .style('stroke-width', '0.4px');
                
                svg.append('circle')
                .attr('cx',len-20)
                .attr('cy',30)
                .attr('r', 3)
                .style('fill', '#aad4b0')
                .style('stroke', '#484e46')
                .style('stroke-width', '0.4px')
                .style('stroke-dasharray','2 1');
               
                svg.append('circle')
                .attr('cx',len-50)
                .attr('cy',10).attr('r', 3)
                .style('fill', '#ffffff')
                .style('stroke', '#f39191')
                .style('stroke-width', '0.4px');
                
                svg.append('text')
                .attr('x', len-15)
                .attr('y', 10)
                .text('Leader')
                .style('font-size', '4px')
                .attr('alignment-baseline','middle');
                
                svg.append('text')
                .attr('x', len-15)
                .attr('y',20 )
                .text('Router')
                .style('font-size', '4px')
                .attr('alignment-baseline','middle');
                
                svg.append('text')
                .attr('x', len-15)
                .attr('y',30 )
                .text('Child')
                .style('font-size', '4px')
                .attr('alignment-baseline','middle');
                svg.append('text')
                .attr('x', len-45)
                .attr('y',10 )
                .text('Selected')
                .style('font-size', '4px')
                .attr('alignment-baseline','middle');
            
            const link = svg.selectAll('.link')
                .data(json.links)
                .attr('class', 'link')
                .on('mousemove', function() {
                    return tooltip.style('top', (d3.event.pageY - 10) + 'px')
                        .style('left', (d3.event.pageX + 10) + 'px');
                })
                .on('mouseout', function() {
                    return tooltip.style('visibility', 'hidden');
                })
                .join((enter) => enter.append("line")
                            .attr('class', 'link')
                            .style('stroke', '#908484')
                            .style('stroke-dasharray', function(d) {
                                if ('Timeout' in d.linkInfo) return '4 4';
                                else return '0 0'
                            })
                            .style('stroke-width', function(d) {
                                if ('inQuality' in d.linkInfo)
                                    return Math.sqrt(d.linkInfo.inQuality/3);
                                else return Math.sqrt(0.5)
                            })
                            .on('mouseover', function(d) {
                                return tooltip.style('visibility', 'visible')
                                    .text(d.linkInfo);
                            })
                            .on('mousemove', function() {
                                return tooltip.style('top', (d3.event.pageY - 10) + 'px')
                                    .style('left', (d3.event.pageX + 10) + 'px');
                            })
                            .on('mouseout', function() {
                                return tooltip.style('visibility', 'hidden');
                            })
                );
            const nodeChild = svg.append('g')
                .selectAll('circle')
                .data(json.nodes)
                .enter()
                .filter(d => d.Role == 'Child')
                .append('circle')
                
                .attr('r', '6')
                .attr('fill', '#aad4b0')
                .style('stroke', '#484e46')
                .style('stroke-dasharray','2 1')
                .style('stroke-width', '0.5px')
                .attr('class', function(d) {
                        return d.Rloc16;
                })
                .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
                 .on('mouseover', function(d) {
                    return tooltip.style('visibility', 'visible')
                        .text(d.Rloc16);
                })
                .on('mousemove', function() {
                    return tooltip.style('top', (d3.event.pageY - 10) + 'px')
                        .style('left', (d3.event.pageX + 10) + 'px');
                })
                .on('mouseout', function() {
                    return tooltip.style('visibility', 'hidden');
                });
            
            const nodeRouter = svg.append('g')
                .selectAll('circle')
                .data(json.nodes)
                .enter()
                .filter(d => d.Role != 'Child')
                .append('circle')
                
                .attr('r', function(d){
                    if (d.Role == 'Leader' ){
                        return '8';
                    }
                    else {
                        return '7'
                    }
                })
                .attr('fill', function(d){
                    if (d.Role == 'Leader'){
                        return '#7e77f8';
                    }
                    else {
                        return '#03e2dd';
                    }
                })
                .style('stroke', '#484e46')
                
                .style('stroke-width', '1px')
            
                .attr('class', function(d) {
                    return 'Stroke';
                })
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended))
                    .on('mouseover', function(d) {
                        d3.select(this).transition()
                            .attr('r', function(d)
                            {
                                if (d.Role == 'Leader' ){
                                    return '9';
                            }
                                else 
                                {
                                    return '8'
                                }
                            });
                
                        return tooltip.style('visibility', 'visible')
                                      .text(d.Rloc16 );

                })
                .on('mousemove', function() {
                    return tooltip.style('top', (d3.event.pageY - 10) + 'px')
                                  .style('left', (d3.event.pageX + 10) + 'px');
                })
                .on('mouseout', function() {
                
                    d3.select(this).transition()
                        .attr('r', function(d)
                        {
                            if (d.Role == 'Leader' ){
                                return '8';
                            }
                            else 
                            {
                                return '7'
                            }
                        }
                        );
                    return tooltip.style('visibility', 'hidden');

                })

                   
                .on('click', function(d) {
                    d3.selectAll('.Stroke').style('stroke', '#484e46')
                    .style('stroke-width', '1px');
                    d3.select(this).style('stroke', '#f39191')
                                .style('stroke-width', '1px');
                    $scope.$apply(function() 
                    {
                        $scope.nodeDetailInfo = d;
                        $scope.updateDetailLabel();
                    });
                });
            
            simulation.nodes(json.nodes).force('link').links(json.links);
            
            simulation.on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                
                   
                nodeChild
                    .attr('cx', node => node.x)
                    .attr('cy', node => node.y);
                nodeRouter
                    .attr('cx', node => node.x)
                    .attr('cy', node => node.y);
                  });
            $scope.updateDetailLabel();
            $scope.graphisReady = true;
        }
    };
})();
