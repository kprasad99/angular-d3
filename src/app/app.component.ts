import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Angular5 D3v4 Example';

  ngOnInit() {

    const width = 1000, height = 600;
    let  centered;

    const projection = d3.geoMercator()
      .center([78, 27])
      .scale(1000);

    const path: any = d3.geoPath()
      .projection(projection);


    const svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Setup groups
    // --------------------------------------
    // Add groups for arcs and images. If arcs are added before images, they
    //  will appear under the images.
    // order is important
    const stateGroup = g.append('g');
    const arcGroup = g.append('g');
    const imageGroup = g.append('g');
    const pointGroup = g.append('g');

    d3.json('assets/states.topojson', function (error, ins: any) {
      // draw states
      stateGroup.append('g')
        .attr('id', 'states')
        .selectAll('path')
        .data(topojson.feature(ins, ins.objects.states).features)
        .enter().append('path')
        .attr('d', path)
        .on('click', clicked);

      stateGroup.append('path')
        .datum(topojson.mesh(ins, ins.objects.states, (a, b) => a !== b))
        .attr('id', 'state-borders')
        .attr('d', path);

      d3.csv('assets/major-cities.csv', function (error1, data) {
        // Draw images after drawing paths.
        imageGroup.selectAll('image').data([0])
          .data(data)
          .enter()
          .append('image')
          .attr('xlink:href', d =>  './assets/images/' + d.code.toLowerCase() + '.jpg')
          .attr('width', '34')
          .attr('height', '34')
          .attr('x', d => projection([+d.lon, +d.lat])[0] - 15)
          .attr('y', d => projection([+d.lon, +d.lat])[1] - 15);

        // Also, text needs to be added to the `g` group
        const point = pointGroup.append('g')
          .attr('class', 'points')
          .selectAll('g')
          .data(data)
          .enter().append('g')
          .attr('transform', d => 'translate(' + projection([+d.lon, +d.lat]) + ')');

        point.append('text')
          .attr('y', 5)
          .attr('dx', '1em')
          .text(function (d) { return d.center; });

        const tweenDash = function tweenDashM() {
          // This function is used to animate the dash-array property, which is a
          //  nice hack that gives us animation along some arbitrary path (in this
          //  case, makes it look like a line is being drawn from point A to B)
          const len = this.getTotalLength(),
            interpolate = d3.interpolateString('0,' + len, len + ',' + len);

          return t => interpolate(t);
        };

        // --- Add paths
        // Format of object is an array of objects, each containing
        //  a type (LineString - the path will automatically draw a greatArc)
        //  and coordinates
        let links = [
          {
            type: 'LineString',
            coordinates: [
              [data[0].lon, data[0].lat],
              [data[1].lon, data[1].lat]
            ]
          }
        ];

        // you can build the links any way you want - e.g., if you have only
        //  certain items you want to draw paths between
        // Alterntively, it can be created automatically based on the data
        links = [];
        for (let i = 0, len = data.length - 1; i < len; i++) {
          // (note: loop until length - 1 since we're getting the next
          //  item with i+1)
          links.push({
            type: 'LineString',
            coordinates: [
              [data[i].lon, data[i].lat],
              [data[i + 1].lon, data[i + 1].lat]
            ]
          });
        }

        // Standard enter / update
        const pathArcs = arcGroup.selectAll('.arc')
          .data(links).enter()
          .append('path').attr('class', 'arc').style(
          'fill', 'none');

        // update
        pathArcs.attr('d', path)
          .style('stroke', '#0000ff')
          .style('stroke-width', '2px')
          .transition().duration(1500)
          .attrTween('stroke-dasharray', tweenDash);

        // exit
        pathArcs.exit().remove();

      });

    });

    function clicked(d) {
      let x, y, k;

      if (d && centered !== d) {
        const centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
      } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
      }

      g.selectAll('path')
        .classed('active', centered && function (d1) { return d1 === centered; });

      g.transition()
        .duration(750)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .style('stroke-width', 1.5 / k + 'px');
    }

  }
}
