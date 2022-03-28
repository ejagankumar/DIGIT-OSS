package org.egov.edcr.feature;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.egov.edcr.entity.blackbox.PlanDetail;
import org.kabeja.dxf.DXFBlock;
import org.kabeja.dxf.DXFConstants;
import org.kabeja.dxf.DXFDimension;
import org.kabeja.dxf.DXFDocument;
import org.kabeja.dxf.DXFEntity;
import org.kabeja.dxf.DXFLayer;
import org.kabeja.dxf.DXFLine;
import org.kabeja.dxf.helpers.Point;
import org.kabeja.math.MathUtils;

public class DimensionMeasurement extends FeatureExtract {
	private static final Logger LOG = LogManager.getLogger(DimensionMeasurement.class);
    /*
     * We are taking the reference points 3 and 4 from dimension, checking the reference points with the lines start point . which
     * 2 line matches we calculate the distance
     */
    @Override
    public PlanDetail extract(PlanDetail pl) {

        DXFDocument doc = pl.getDoc();
        Iterator dxfLayerIterator = doc.getDXFLayerIterator();
        while (dxfLayerIterator.hasNext()) {

            DXFLayer dxfLayer = (DXFLayer) dxfLayerIterator.next();

            List dimensions = dxfLayer.getDXFEntities(DXFConstants.ENTITY_TYPE_DIMENSION);

            if (dimensions != null) {
                Iterator iterator = dimensions.iterator();

                while (iterator.hasNext()) {
                    DXFDimension dimension = (DXFDimension) iterator.next();
                    List<DXFLine> lines = new ArrayList<>();
                    LOG.info("Layer = " + dxfLayer.getName());
                    LOG.info("Reference point = " + dimension.getReferencePoint());
                    LOG.info("Reference point 3 = " + dimension.getReferencePoint3());
                    LOG.info("Reference point 4 = " + dimension.getReferencePoint4());
                    LOG.info("Reference point 5 = " + dimension.getReferencePoint5());
                    LOG.info("Reference point 6 = " + dimension.getReferencePoint6());
                    LOG.info("Dimension rotation = " + dimension.getDimensionRotation());
                    LOG.info("Dimension Bounds = " + "Max x = " + dimension.getBounds().getMaximumX()
                            + ", Max y = " + dimension.getBounds().getMaximumY());
                    LOG.info("Dimension Bounds = " + "Min x = " + dimension.getBounds().getMinimumX()
                            + ", Min y = " + dimension.getBounds().getMinimumY());
                    String dimensionBlock = dimension.getDimensionBlock();
                    DXFBlock dxfBlock = doc.getDXFBlock(dimensionBlock);

                    Iterator entitiesIterator = dxfBlock.getDXFEntitiesIterator();
                    while (entitiesIterator.hasNext()) {
                        DXFEntity e = (DXFEntity) entitiesIterator.next();
                        if (e.getType().equals(DXFConstants.ENTITY_TYPE_LINE)) {
                            DXFLine line = (DXFLine) e;
                            lines.add(line);
                        }

                    }

                    Point p1 = new Point();
                    Point p2 = new Point();

                    for (DXFLine line : lines) {
                        LOG.info("Line start point  = " + line.getLength() + ", " + line.getStartPoint()
                                + ", end point = " + line.getEndPoint());
                        if (dimension.getDimensionRotation() == 90) {
                            if (line.getStartPoint().getY() == dimension.getReferencePoint3().getY())
                                p1 = line.getEndPoint();

                            if (line.getStartPoint().getY() == dimension.getReferencePoint4().getY())
                                p2 = line.getEndPoint();
                        }

                        if (dimension.getDimensionRotation() == 0) {
                            if (line.getStartPoint().getX() == dimension.getReferencePoint3().getX())
                                p1 = line.getEndPoint();

                            if (line.getStartPoint().getX() == dimension.getReferencePoint4().getX())
                                p2 = line.getEndPoint();
                        }

                    }

                    LOG.info("p1 = " + p1);
                    LOG.info("p2 = " + p2);
                    Double distance = MathUtils.distance(p1, p2);

                    LOG.info("Calculated Distance  = " + distance + "\n");

                }
            }
        }
        return pl;
    }

    @Override
    public PlanDetail validate(PlanDetail pl) {
        return pl;
    }

}